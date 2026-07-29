"""
Agent 4 — Risk Assessment & Forecasting Tools
All calculations are deterministic using scikit-learn + scipy + pure Python.
No LLM involvement in any tool.
"""

import json
from pathlib import Path
from datetime import date, datetime

import numpy as np
import pandas as pd
from scipy.stats import norm
from sklearn.preprocessing import MinMaxScaler

_ROOT = Path(__file__).resolve().parent.parent.parent

# ── Load reference data ───────────────────────────────────────────────────────

def _load_supply() -> pd.DataFrame:
    return pd.read_csv(_ROOT / "agent1-supply-chain" / "data" / "supply_chain_data.csv")

def _load_contracts() -> pd.DataFrame:
    return pd.read_csv(_ROOT / "agent3-vendor-contract" / "data" / "contracts.csv")

def _load_budgets() -> pd.DataFrame:
    return pd.read_csv(_ROOT / "agent2-budget-finance" / "data" / "budgets.csv")


# ── Supplier profile cache (built once from CSV) ──────────────────────────────

def _build_supplier_profiles() -> dict:
    """
    Aggregate per-supplier stats from supply chain CSV.
    Returns dict keyed by supplier name (lowercase).
    """
    df = _load_supply()
    profiles = {}
    for supplier, grp in df.groupby("Supplier name"):
        avg_lead      = float(grp["Lead time"].mean())
        avg_defect    = float(grp["Defect rates"].mean())
        avg_shipping  = float(grp["Shipping times"].mean())
        fail_rate     = float((grp["Inspection results"].str.lower() == "fail").mean())
        avg_cost      = float(grp["Costs"].mean())
        profiles[supplier.lower()] = {
            "supplier_name":   supplier,
            "avg_lead_time":   round(avg_lead, 1),
            "avg_defect_rate": round(avg_defect, 3),
            "avg_shipping_time": round(avg_shipping, 1),
            "inspection_fail_rate": round(fail_rate, 3),
            "avg_logistics_cost":  round(avg_cost, 2),
            "sku_count": len(grp),
        }
    return profiles

_SUPPLIER_PROFILES = _build_supplier_profiles()

# Supplier 1..5 → contract vendor mapping (same as orchestrator)
_VENDOR_MAP = {
    "supplier 1": "Dell Technologies",
    "supplier 2": "Cisco Systems",
    "supplier 3": "NVIDIA",
    "supplier 4": "FedEx",
    "supplier 5": "Oracle",
}

_RISK_WEIGHTS = {
    "inventory_risk":   0.30,   # operational severity
    "budget_pressure":  0.20,   # financial strain
    "vendor_risk":      0.20,   # contract/compliance risk
    "lead_time_risk":   0.15,   # delivery timeline risk
    "defect_risk":      0.15,   # quality risk
}

_RISK_LEVELS = {
    "CRITICAL": 4,
    "HIGH":     3,
    "MEDIUM":   2,
    "LOW":      1,
}


# ════════════════════════════════════════════════════════════════════════════
# TOOL 1 — calculate_risk_score
# ════════════════════════════════════════════════════════════════════════════

def calculate_risk_score(
    inventory_risk: str,
    remaining_budget: float,
    purchase_feasible: bool,
    approved_vendor: bool,
    lead_time: int,
    defect_rate: float = 2.0,
    budget_allocated: float = 180000.0,
) -> dict:
    """
    Compute a 0–100 composite risk score using weighted sub-scores.
    Uses MinMaxScaler to normalize each dimension onto [0, 1].

    Sub-scores:
      - inventory_risk  : mapped from CRITICAL/HIGH/MEDIUM/LOW → 100/75/50/25
      - budget_pressure : (1 - remaining/allocated) * 100, capped at 100
      - vendor_risk     : 100 if not approved, 0 if approved
      - lead_time_risk  : normalized lead time (0–30 days → 0–100)
      - defect_risk     : normalized defect rate (0–5% → 0–100)
    """
    inv_score    = {4: 100, 3: 75, 2: 50, 1: 25}.get(_RISK_LEVELS.get(inventory_risk.upper(), 2), 50)
    budget_ratio = min((budget_allocated - remaining_budget) / max(budget_allocated, 1), 1.0)
    budget_score = round(budget_ratio * 100, 1)
    if not purchase_feasible:
        budget_score = min(budget_score + 20, 100)

    vendor_score  = 0.0 if approved_vendor else 100.0
    lead_score    = float(np.clip((lead_time / 30.0) * 100, 0, 100))
    defect_score  = float(np.clip((defect_rate / 5.0) * 100, 0, 100))

    # Use MinMaxScaler to re-scale the raw sub-scores vector (ensures consistent 0–100 range)
    raw = np.array([[inv_score, budget_score, vendor_score, lead_score, defect_score]])
    # Reference matrix: worst-case row [100,100,100,100,100], best-case [0,0,0,0,0]
    ref = np.array([[0, 0, 0, 0, 0], [100, 100, 100, 100, 100]])
    scaler = MinMaxScaler(feature_range=(0, 100))
    scaler.fit(ref)
    scaled = scaler.transform(raw)[0]

    weights = list(_RISK_WEIGHTS.values())
    composite = float(np.dot(scaled, weights))
    composite = round(min(max(composite, 0), 100), 1)

    if composite >= 75:
        level = "CRITICAL"
    elif composite >= 55:
        level = "HIGH"
    elif composite >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "overall_risk":    level,
        "risk_score":      composite,
        "sub_scores": {
            "inventory_risk":  round(inv_score, 1),
            "budget_pressure": round(budget_score, 1),
            "vendor_risk":     round(vendor_score, 1),
            "lead_time_risk":  round(lead_score, 1),
            "defect_risk":     round(defect_score, 1),
        },
        "weights": _RISK_WEIGHTS,
    }


# ════════════════════════════════════════════════════════════════════════════
# TOOL 2 — forecast_delay
# ════════════════════════════════════════════════════════════════════════════

def forecast_delay(
    supplier_name: str,
    lead_time: int,
    shortage_quantity: int,
    has_shortage: bool,
) -> dict:
    """
    Forecast expected delivery delay using:
      - Historical supplier shipping time distribution (mean + std from CSV)
      - scipy.stats.norm to compute P(delay > threshold)
      - Shortage penalty: +1 day per 50 units short, capped at +10 days
    """
    profile = _SUPPLIER_PROFILES.get(supplier_name.lower())
    if profile is None:
        # fallback: use global average
        df = _load_supply()
        mu  = float(df["Shipping times"].mean())
        std = float(df["Shipping times"].std())
    else:
        # Compute std from raw data for this supplier
        df = _load_supply()
        grp = df[df["Supplier name"].str.lower() == supplier_name.lower()]["Shipping times"]
        mu  = float(grp.mean())
        std = float(grp.std()) if len(grp) > 1 else 1.5

    shortage_penalty = min(int(shortage_quantity / 50), 10) if has_shortage else 0
    expected_delay   = round(mu + shortage_penalty, 1)

    # P(actual delay > lead_time) using normal distribution
    prob_exceed = float(norm.sf(lead_time, loc=mu, scale=max(std, 0.1)))
    prob_exceed = round(min(max(prob_exceed, 0.0), 1.0), 4)

    # Confidence interval (95%)
    ci_low  = round(max(norm.ppf(0.025, loc=mu, scale=max(std, 0.1)), 0), 1)
    ci_high = round(norm.ppf(0.975, loc=mu, scale=max(std, 0.1)), 1)

    if expected_delay <= 3:
        severity = "MINIMAL"
    elif expected_delay <= 6:
        severity = "MODERATE"
    elif expected_delay <= 10:
        severity = "SIGNIFICANT"
    else:
        severity = "SEVERE"

    return {
        "supplier_name":       supplier_name,
        "base_shipping_mean":  round(mu, 1),
        "base_shipping_std":   round(std, 2),
        "shortage_penalty_days": shortage_penalty,
        "expected_delay_days": expected_delay,
        "delay_severity":      severity,
        "prob_exceed_lead_time": prob_exceed,
        "confidence_interval_95": [ci_low, ci_high],
        "lead_time_given":     lead_time,
    }


# ════════════════════════════════════════════════════════════════════════════
# TOOL 3 — evaluate_supplier_options
# ════════════════════════════════════════════════════════════════════════════

def evaluate_supplier_options(required_quantity: int, max_lead_time: int = 30) -> dict:
    """
    Score all 5 suppliers using a weighted multi-criteria matrix:
      - lead_time_score  (lower is better, weight 0.30)
      - defect_score     (lower is better, weight 0.30)
      - shipping_score   (lower is better, weight 0.20)
      - cost_score       (lower is better, weight 0.10)
      - reliability      (lower fail rate is better, weight 0.10)

    Uses MinMaxScaler to normalize each criterion across all suppliers.
    Returns ranked list with composite score (0=best, 100=worst).
    """
    contracts = _load_contracts()
    active_vendors = set(contracts[contracts["status"] == "active"]["vendor"].str.lower())

    rows = []
    for key, profile in _SUPPLIER_PROFILES.items():
        vendor_name = _VENDOR_MAP.get(key, "Unknown")
        contract_rows = contracts[contracts["vendor"].str.lower().str.contains(vendor_name.lower().split()[0])]
        has_contract  = not contract_rows.empty
        contract_active = vendor_name.lower() in active_vendors or any(
            vendor_name.lower().split()[0] in v for v in active_vendors
        )
        rows.append({
            "supplier":          profile["supplier_name"],
            "vendor":            vendor_name,
            "avg_lead_time":     profile["avg_lead_time"],
            "avg_defect_rate":   profile["avg_defect_rate"],
            "avg_shipping_time": profile["avg_shipping_time"],
            "avg_cost":          profile["avg_logistics_cost"],
            "fail_rate":         profile["inspection_fail_rate"],
            "has_contract":      has_contract,
            "contract_active":   contract_active,
        })

    df = pd.DataFrame(rows)

    # Normalize with MinMaxScaler (higher raw value = worse = higher score)
    criteria = ["avg_lead_time", "avg_defect_rate", "avg_shipping_time", "avg_cost", "fail_rate"]
    weights  = [0.30, 0.30, 0.20, 0.10, 0.10]

    scaler = MinMaxScaler(feature_range=(0, 100))
    scaled = scaler.fit_transform(df[criteria].values)

    df["composite_score"] = np.dot(scaled, weights).round(1)

    # Penalize suppliers without active contracts
    df.loc[~df["contract_active"], "composite_score"] = (
        df.loc[~df["contract_active"], "composite_score"] + 20
    ).clip(upper=100)

    df = df.sort_values("composite_score")

    return {
        "required_quantity": required_quantity,
        "max_lead_time":     max_lead_time,
        "suppliers": df[[
            "supplier", "vendor", "avg_lead_time", "avg_defect_rate",
            "avg_shipping_time", "avg_cost", "fail_rate",
            "contract_active", "composite_score"
        ]].to_dict(orient="records"),
        "best_supplier": df.iloc[0]["supplier"],
        "best_vendor":   df.iloc[0]["vendor"],
    }


# ════════════════════════════════════════════════════════════════════════════
# TOOL 4 — estimate_financial_impact
# ════════════════════════════════════════════════════════════════════════════

def estimate_financial_impact(
    shortage_quantity: int,
    unit_cost: float,
    lead_time: int,
    inventory_risk: str,
    remaining_budget: float,
    purchase_feasible: bool,
) -> dict:
    """
    Estimate total financial impact of the incident:
      - procurement_cost    : shortage_quantity * unit_cost
      - holding_cost        : 2% of procurement_cost per day of lead time
      - stockout_cost       : risk-multiplied lost revenue estimate
      - expedite_premium    : 15% surcharge if CRITICAL/HIGH risk
      - total_estimated_cost: sum of above
      - budget_gap          : max(0, total - remaining_budget)
    """
    procurement_cost = round(shortage_quantity * unit_cost, 2)
    holding_cost     = round(procurement_cost * 0.02 * lead_time, 2)

    risk_multiplier = {"CRITICAL": 0.25, "HIGH": 0.15, "MEDIUM": 0.08, "LOW": 0.03}
    stockout_cost   = round(procurement_cost * risk_multiplier.get(inventory_risk.upper(), 0.08), 2)

    expedite_premium = 0.0
    if inventory_risk.upper() in ("CRITICAL", "HIGH"):
        expedite_premium = round(procurement_cost * 0.15, 2)

    total = round(procurement_cost + holding_cost + stockout_cost + expedite_premium, 2)
    budget_gap = round(max(total - remaining_budget, 0), 2)

    if budget_gap > 0:
        financial_verdict = "BUDGET_SHORTFALL"
    elif total > remaining_budget * 0.8:
        financial_verdict = "BUDGET_STRAINED"
    else:
        financial_verdict = "BUDGET_ADEQUATE"

    return {
        "shortage_quantity":  shortage_quantity,
        "unit_cost":          unit_cost,
        "procurement_cost":   procurement_cost,
        "holding_cost":       holding_cost,
        "stockout_cost":      stockout_cost,
        "expedite_premium":   expedite_premium,
        "total_estimated_cost": total,
        "remaining_budget":   remaining_budget,
        "budget_gap":         budget_gap,
        "financial_verdict":  financial_verdict,
        "purchase_feasible":  purchase_feasible,
    }


# ════════════════════════════════════════════════════════════════════════════
# TOOL 5 — recommend_supplier
# ════════════════════════════════════════════════════════════════════════════

def recommend_supplier(
    current_supplier: str,
    inventory_risk: str,
    required_quantity: int,
    max_lead_time: int,
    purchase_feasible: bool,
    approved_vendor: bool,
) -> dict:
    """
    Select the optimal supplier by combining:
      - evaluate_supplier_options() composite scores
      - Contract active status (hard filter for CRITICAL risk)
      - Current supplier penalty if risk is HIGH/CRITICAL
    Returns final recommendation with rationale.
    """
    options = evaluate_supplier_options(required_quantity, max_lead_time)
    suppliers = options["suppliers"]

    risk_level = inventory_risk.upper()

    # For CRITICAL/HIGH: filter to contract-active only
    if risk_level in ("CRITICAL", "HIGH"):
        active = [s for s in suppliers if s["contract_active"]]
        pool = active if active else suppliers
    else:
        pool = suppliers

    # Penalize current supplier if risk is HIGH/CRITICAL and vendor not approved
    current_lower = current_supplier.lower()
    for s in pool:
        if s["supplier"].lower() == current_lower and risk_level in ("CRITICAL", "HIGH") and not approved_vendor:
            s["composite_score"] = min(s["composite_score"] + 30, 100)

    pool_sorted = sorted(pool, key=lambda x: x["composite_score"])
    best = pool_sorted[0]

    is_switch = best["supplier"].lower() != current_lower

    if risk_level == "CRITICAL":
        action = "IMMEDIATE_SWITCH" if is_switch else "EMERGENCY_REORDER"
    elif risk_level == "HIGH":
        action = "SWITCH_RECOMMENDED" if is_switch else "EXPEDITE_ORDER"
    else:
        action = "REORDER_CURRENT" if not is_switch else "CONSIDER_SWITCH"

    rationale_parts = [
        f"Selected {best['supplier']} (vendor: {best['vendor']}) with composite risk score {best['composite_score']}.",
        f"Avg lead time: {best['avg_lead_time']} days, defect rate: {best['avg_defect_rate']:.2f}%, contract active: {best['contract_active']}.",
    ]
    if is_switch:
        rationale_parts.append(f"Switch from {current_supplier} recommended due to {risk_level} risk level.")
    if not purchase_feasible:
        rationale_parts.append("Budget is insufficient — escalate to Finance for emergency approval.")

    return {
        "recommended_supplier": best["supplier"],
        "recommended_vendor":   best["vendor"],
        "composite_score":      best["composite_score"],
        "action":               action,
        "switch_required":      is_switch,
        "contract_active":      best["contract_active"],
        "avg_lead_time":        best["avg_lead_time"],
        "avg_defect_rate":      best["avg_defect_rate"],
        "rationale":            " ".join(rationale_parts),
        "all_options":          pool_sorted[:3],   # top 3 alternatives
    }
