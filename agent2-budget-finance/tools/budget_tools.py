"""
Agent 2 — Budget & Financial Analytics Tools
All calculations are deterministic Pandas/Python — no LLM involvement.
"""

from pathlib import Path
import pandas as pd

_BASE = Path(__file__).resolve().parent.parent / "data"

def _budgets():     return pd.read_csv(_BASE / "budgets.csv")
def _procurement(): return pd.read_csv(_BASE / "procurement.csv")
def _expenses():    return pd.read_csv(_BASE / "expenses.csv")
def _cloud():       return pd.read_csv(_BASE / "cloud_costs.csv")

def _safe_dept(df, department: str):
    match = df[df["department"].str.lower() == department.lower()]
    return None if match.empty else match


# 1. Remaining Budget
def get_remaining_budget(department: str = None) -> list[dict] | dict:
    df = _budgets()
    if department:
        row = _safe_dept(df, department)
        if row is None:
            return {"error": f"Department '{department}' not found"}
        row = row.iloc[0]
        remaining = float(row["allocated_budget"]) - float(row["spent_budget"])
        pct_used = round(float(row["spent_budget"]) / float(row["allocated_budget"]) * 100, 1)
        return {
            "department": row["department"],
            "allocated_budget": float(row["allocated_budget"]),
            "spent_budget": float(row["spent_budget"]),
            "remaining_budget": remaining,
            "percent_used": pct_used,
            "status": "OVER_BUDGET" if remaining < 0 else "WARNING" if pct_used >= 90 else "HEALTHY",
        }
    df["remaining"] = df["allocated_budget"] - df["spent_budget"]
    df["percent_used"] = (df["spent_budget"] / df["allocated_budget"] * 100).round(1)
    df["status"] = df.apply(
        lambda r: "OVER_BUDGET" if r["remaining"] < 0 else "WARNING" if r["percent_used"] >= 90 else "HEALTHY", axis=1
    )
    return df[["department", "allocated_budget", "spent_budget", "remaining", "percent_used", "status"]].to_dict(orient="records")


# 2. Purchase Feasibility
def check_purchase_feasibility(department: str, amount: float, item: str = "") -> dict:
    df = _budgets()
    row = _safe_dept(df, department)
    if row is None:
        return {"error": f"Department '{department}' not found"}
    row = row.iloc[0]
    remaining = float(row["allocated_budget"]) - float(row["spent_budget"])
    feasible = remaining >= amount
    return {
        "department": department,
        "item": item or "Requested Purchase",
        "requested_amount": amount,
        "remaining_budget": remaining,
        "feasible": feasible,
        "verdict": "APPROVED" if feasible else "REJECTED",
        "shortfall": round(max(amount - remaining, 0), 2),
        "remaining_after": round(remaining - amount, 2) if feasible else None,
    }


# 3. Budget Utilization
def get_budget_utilization(category: str = None) -> list[dict]:
    df = _budgets()
    if category:
        df = df[df["category"].str.lower() == category.lower()]
    df = df.copy()
    df["utilization_pct"] = (df["spent_budget"] / df["allocated_budget"] * 100).round(1)
    df["remaining"] = df["allocated_budget"] - df["spent_budget"]
    df = df.sort_values("utilization_pct", ascending=False)
    return df[["department", "category", "allocated_budget", "spent_budget", "remaining", "utilization_pct"]].to_dict(orient="records")


# 4. Cost Anomaly Detection
def detect_cost_anomalies(threshold_pct: float = 85.0) -> dict:
    df = _budgets()
    df = df.copy()
    df["utilization_pct"] = (df["spent_budget"] / df["allocated_budget"] * 100).round(1)

    over_budget   = df[df["utilization_pct"] > 100].to_dict(orient="records")
    near_limit    = df[(df["utilization_pct"] >= threshold_pct) & (df["utilization_pct"] <= 100)].to_dict(orient="records")
    healthy       = df[df["utilization_pct"] < threshold_pct].to_dict(orient="records")

    # procurement anomalies — large pending purchases
    proc = _procurement()
    large_pending = proc[(proc["status"] == "pending") & (proc["amount"] > 50000)].to_dict(orient="records")

    # expense anomalies — unapproved expenses
    exp = _expenses()
    unapproved = exp[exp["approved"] == False].to_dict(orient="records")

    return {
        "over_budget_departments": over_budget,
        "near_limit_departments": near_limit,
        "healthy_departments": healthy,
        "large_pending_purchases": large_pending,
        "unapproved_expenses": unapproved,
        "anomaly_count": len(over_budget) + len(large_pending) + len(unapproved),
    }


# 5. Department Expenses
def get_department_expenses(department: str = None) -> list[dict]:
    df = _expenses()
    if department:
        df = df[df["department"].str.lower() == department.lower()]
    total = df.groupby("department")["amount"].sum().reset_index()
    total.columns = ["department", "total_expenses"]
    by_cat = df.groupby(["department", "category"])["amount"].sum().reset_index()
    result = []
    for _, row in total.iterrows():
        cats = by_cat[by_cat["department"] == row["department"]].set_index("category")["amount"].to_dict()
        result.append({
            "department": row["department"],
            "total_expenses": float(row["total_expenses"]),
            "by_category": {k: float(v) for k, v in cats.items()},
        })
    return result


# 6. Procurement Summary
def get_procurement_summary(department: str = None, status: str = None) -> dict:
    df = _procurement()
    if department:
        df = df[df["department"].str.lower() == department.lower()]
    if status:
        df = df[df["status"].str.lower() == status.lower()]
    return {
        "total_purchases": len(df),
        "total_amount": round(float(df["amount"].sum()), 2),
        "approved_amount": round(float(df[df["status"] == "approved"]["amount"].sum()), 2),
        "pending_amount": round(float(df[df["status"] == "pending"]["amount"].sum()), 2),
        "by_department": df.groupby("department")["amount"].sum().round(2).to_dict(),
        "by_category": df.groupby("category")["amount"].sum().round(2).to_dict(),
        "top_purchases": df.nlargest(5, "amount")[["purchase_id", "department", "vendor", "item", "amount", "status"]].to_dict(orient="records"),
    }


# 7. Cloud Cost Trend
def get_cloud_cost_trend() -> dict:
    df = _cloud()
    avg = float(df["total_cost"].mean())
    latest = df.iloc[-1]
    over_months = df[df["total_cost"] > df["budget_limit"]]["month"].tolist()
    return {
        "months": df["month"].tolist(),
        "total_costs": df["total_cost"].tolist(),
        "budget_limit": float(latest["budget_limit"]),
        "average_monthly_cost": round(avg, 2),
        "latest_month": latest["month"],
        "latest_cost": float(latest["total_cost"]),
        "over_budget_months": over_months,
        "trend": "INCREASING" if df["total_cost"].iloc[-1] > df["total_cost"].iloc[0] else "DECREASING",
    }


# 8. Full Budget Summary
def get_budget_summary() -> dict:
    df = _budgets()
    df = df.copy()
    df["remaining"] = df["allocated_budget"] - df["spent_budget"]
    df["pct"] = (df["spent_budget"] / df["allocated_budget"] * 100).round(1)
    proc = _procurement()
    exp = _expenses()
    return {
        "total_allocated": round(float(df["allocated_budget"].sum()), 2),
        "total_spent": round(float(df["spent_budget"].sum()), 2),
        "total_remaining": round(float(df["remaining"].sum()), 2),
        "overall_utilization_pct": round(float(df["spent_budget"].sum()) / float(df["allocated_budget"].sum()) * 100, 1),
        "over_budget_depts": df[df["remaining"] < 0]["department"].tolist(),
        "warning_depts": df[(df["pct"] >= 90) & (df["remaining"] >= 0)]["department"].tolist(),
        "total_procurement_spend": round(float(proc["amount"].sum()), 2),
        "total_expense_spend": round(float(exp["amount"].sum()), 2),
        "departments": len(df),
    }
