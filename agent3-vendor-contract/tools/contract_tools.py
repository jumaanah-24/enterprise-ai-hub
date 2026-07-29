"""
Agent 3 — Vendor & Contract Policy Tools
RAG over policy documents + deterministic contract queries.
"""

from pathlib import Path
from datetime import date, datetime
import pandas as pd
import numpy as np

_BASE   = Path(__file__).resolve().parent.parent / "data"
_POLICY = _BASE / "vendor_policy.txt"

# ── RAG: simple TF-IDF style chunk search (no heavy model needed) ────────────

def _load_chunks() -> list[dict]:
    text = _POLICY.read_text(encoding="utf-8")
    sections = text.split("\n========================================\n")
    chunks = []
    for sec in sections:
        lines = [l.strip() for l in sec.strip().splitlines() if l.strip()]
        if not lines:
            continue
        # split into ~300-char chunks
        body = " ".join(lines)
        for i in range(0, max(1, len(body)), 600):
            chunk = body[i:i+600].strip()
            if chunk:
                chunks.append({"text": chunk, "section": lines[0][:80]})
    return chunks

_CHUNKS = _load_chunks()

def _score(query: str, chunk: str) -> float:
    q_words = set(query.lower().split())
    c_words = set(chunk.lower().split())
    if not q_words:
        return 0.0
    return len(q_words & c_words) / len(q_words)

def search_policy(query: str, top_k: int = 4) -> dict:
    """RAG search over vendor policy document."""
    scored = sorted(_CHUNKS, key=lambda c: _score(query, c["text"]), reverse=True)
    results = [{"section": c["section"], "excerpt": c["text"][:400]} for c in scored[:top_k]]
    return {"query": query, "results": results, "source": "vendor_policy.txt"}


# ── Contract CSV tools ────────────────────────────────────────────────────────

def _contracts() -> pd.DataFrame:
    return pd.read_csv(_BASE / "contracts.csv")

def _today() -> date:
    return date.today()


def get_contract_details(vendor: str = None, contract_id: str = None) -> list[dict] | dict:
    df = _contracts()
    if contract_id:
        row = df[df["contract_id"].str.upper() == contract_id.upper()]
        if row.empty:
            return {"error": f"Contract '{contract_id}' not found"}
        return row.iloc[0].to_dict()
    if vendor:
        rows = df[df["vendor"].str.lower().str.contains(vendor.lower())]
        if rows.empty:
            return {"error": f"No contracts found for vendor '{vendor}'"}
        return rows.to_dict(orient="records")
    return df.to_dict(orient="records")


def check_vendor_compliance(vendor: str) -> dict:
    df = _contracts()
    rows = df[df["vendor"].str.lower().str.contains(vendor.lower())]
    if rows.empty:
        return {"error": f"Vendor '{vendor}' not found"}
    row = rows.iloc[0]
    today = _today()
    end = datetime.strptime(str(row["end_date"]), "%Y-%m-%d").date()
    days_left = (end - today).days
    issues = []
    if row["status"] == "expired":
        issues.append("Contract is EXPIRED — renewal required")
    if days_left < 90 and row["status"] == "active":
        issues.append(f"Contract expires in {days_left} days — initiate renewal")
    if row["auto_renew"] == True and days_left < 90:
        issues.append("Auto-renewal clause active — review before renewal date")
    return {
        "vendor": row["vendor"],
        "contract_id": row["contract_id"],
        "status": row["status"],
        "end_date": row["end_date"],
        "days_until_expiry": days_left,
        "compliance_issues": issues if issues else ["No compliance issues found"],
        "compliant": len(issues) == 0,
        "auto_renew": bool(row["auto_renew"]),
        "penalty_clause": row["penalty_clause"],
    }


def get_sla_terms(vendor: str) -> dict:
    df = _contracts()
    rows = df[df["vendor"].str.lower().str.contains(vendor.lower())]
    if rows.empty:
        return {"error": f"Vendor '{vendor}' not found"}
    row = rows.iloc[0]
    uptime = float(row["sla_uptime"])
    meets_standard = uptime >= 99.9
    return {
        "vendor": row["vendor"],
        "category": row["category"],
        "sla_uptime_pct": uptime,
        "sla_response_hours": int(row["sla_response_hours"]),
        "penalty_clause": row["penalty_clause"],
        "meets_minimum_standard": meets_standard,
        "sla_grade": "EXCELLENT" if uptime >= 99.99 else "GOOD" if uptime >= 99.9 else "ACCEPTABLE" if uptime >= 99.5 else "BELOW_STANDARD",
    }


def get_payment_terms(vendor: str = None) -> list[dict] | dict:
    df = _contracts()
    if vendor:
        rows = df[df["vendor"].str.lower().str.contains(vendor.lower())]
        if rows.empty:
            return {"error": f"Vendor '{vendor}' not found"}
        row = rows.iloc[0]
        return {
            "vendor": row["vendor"],
            "payment_terms": row["payment_terms"],
            "contract_value": float(row["value"]),
            "department": row["department"],
            "status": row["status"],
        }
    return df[["vendor", "payment_terms", "value", "department", "status"]].to_dict(orient="records")


def check_vendor_eligibility(vendor: str) -> dict:
    df = _contracts()
    rows = df[df["vendor"].str.lower().str.contains(vendor.lower())]
    if rows.empty:
        return {
            "vendor": vendor,
            "eligible": False,
            "reason": "Vendor not found in contract database — must complete vendor registration",
            "recommendation": "Submit vendor registration form to Procurement Department",
        }
    row = rows.iloc[0]
    today = _today()
    end = datetime.strptime(str(row["end_date"]), "%Y-%m-%d").date()
    days_left = (end - today).days
    eligible = row["status"] == "active" and days_left > 0
    return {
        "vendor": row["vendor"],
        "eligible": eligible,
        "contract_status": row["status"],
        "days_until_expiry": days_left,
        "category": row["category"],
        "reason": "Active contract in good standing" if eligible else "Contract expired or inactive",
        "recommendation": "Eligible for new purchase orders" if eligible else "Renew contract before issuing PO",
    }


def get_expiring_contracts(days_threshold: int = 90) -> dict:
    df = _contracts()
    today = _today()
    results = []
    for _, row in df[df["status"] == "active"].iterrows():
        end = datetime.strptime(str(row["end_date"]), "%Y-%m-%d").date()
        days_left = (end - today).days
        if days_left <= days_threshold:
            results.append({
                "contract_id": row["contract_id"],
                "vendor": row["vendor"],
                "department": row["department"],
                "end_date": row["end_date"],
                "days_until_expiry": days_left,
                "value": float(row["value"]),
                "auto_renew": bool(row["auto_renew"]),
                "urgency": "CRITICAL" if days_left <= 30 else "HIGH" if days_left <= 60 else "MEDIUM",
            })
    results.sort(key=lambda x: x["days_until_expiry"])
    expired = df[df["status"] == "expired"][["contract_id", "vendor", "department", "end_date", "value"]].to_dict(orient="records")
    return {
        "expiring_soon": results,
        "expired_contracts": expired,
        "total_expiring": len(results),
        "total_expired": len(expired),
    }


def get_vendor_summary() -> dict:
    df = _contracts()
    today = _today()
    active = df[df["status"] == "active"]
    expired = df[df["status"] == "expired"]
    total_value = float(active["value"].sum())
    by_dept = active.groupby("department")["value"].sum().round(2).to_dict()
    by_cat  = active.groupby("category")["value"].sum().round(2).to_dict()
    auto_renew_count = int(active["auto_renew"].sum())
    expiring_90 = []
    for _, row in active.iterrows():
        end = datetime.strptime(str(row["end_date"]), "%Y-%m-%d").date()
        if (end - today).days <= 90:
            expiring_90.append(row["vendor"])
    return {
        "total_contracts": len(df),
        "active_contracts": len(active),
        "expired_contracts": len(expired),
        "total_active_value": total_value,
        "auto_renew_contracts": auto_renew_count,
        "expiring_within_90_days": expiring_90,
        "contracts_by_department": by_dept,
        "contracts_by_category": by_cat,
        "top_vendors_by_value": active.nlargest(5, "value")[["vendor", "value", "category"]].to_dict(orient="records"),
    }
