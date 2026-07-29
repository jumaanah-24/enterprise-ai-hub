"""
Deterministic supply-chain data tools using Pandas.
All calculations are pure Python/Pandas — no LLM involvement.
"""

from pathlib import Path
import pandas as pd

# ---------------------------------------------------------------------------
# CSV loading
# ---------------------------------------------------------------------------

_CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "supply_chain_data.csv"

_REQUIRED_COLUMNS = {
    "Product type", "SKU", "Price", "Availability",
    "Number of products sold", "Revenue generated", "Customer demographics",
    "Stock levels", "Lead times", "Order quantities", "Shipping times",
    "Shipping carriers", "Shipping costs", "Supplier name", "Location",
    "Lead time", "Production volumes", "Manufacturing lead time",
    "Manufacturing costs", "Inspection results", "Defect rates",
    "Transportation modes", "Routes", "Costs",
}


def _load_df() -> pd.DataFrame:
    if not _CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found at {_CSV_PATH}")
    df = pd.read_csv(_CSV_PATH)
    missing = _REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing expected columns: {missing}")
    return df


def _get_row(sku: str) -> dict | None:
    """Return the row for *sku* as a dict, or None if not found."""
    df = _load_df()
    match = df[df["SKU"].astype(str).str.strip().str.upper() == sku.strip().upper()]
    if match.empty:
        return None
    return match.iloc[0].to_dict()


def _safe(value, cast=None):
    """Return None for NaN/missing; optionally cast to a type."""
    if pd.isna(value):
        return None
    try:
        return cast(value) if cast else value
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# 1. get_sku_details
# ---------------------------------------------------------------------------

def get_sku_details(sku: str) -> dict:
    row = _get_row(sku)
    if row is None:
        return {"error": f"SKU '{sku}' not found"}
    return {
        "sku": _safe(row["SKU"]),
        "product_type": _safe(row["Product type"]),
        "stock_levels": _safe(row["Stock levels"], int),
        "availability": _safe(row["Availability"], int),
        "order_quantities": _safe(row["Order quantities"], int),
        "supplier_name": _safe(row["Supplier name"]),
        "lead_time": _safe(row["Lead time"], int),
        "shipping_time": _safe(row["Shipping times"], int),
        "shipping_carrier": _safe(row["Shipping carriers"]),
        "inspection_result": _safe(row["Inspection results"]),
        "defect_rate": _safe(row["Defect rates"], float),
        "transportation_mode": _safe(row["Transportation modes"]),
        "route": _safe(row["Routes"]),
    }


# ---------------------------------------------------------------------------
# 2. calculate_inventory_gap
# ---------------------------------------------------------------------------

def calculate_inventory_gap(sku: str) -> dict:
    row = _get_row(sku)
    if row is None:
        return {"error": f"SKU '{sku}' not found"}

    stock = _safe(row["Stock levels"], int)
    order = _safe(row["Order quantities"], int)

    if stock is None or order is None:
        return {"sku": sku, "error": "Missing stock_levels or order_quantities"}

    gap = stock - order
    shortage = max(order - stock, 0)
    return {
        "sku": sku,
        "stock_levels": stock,
        "order_quantities": order,
        "inventory_gap": gap,
        "shortage_quantity": shortage,
        "has_shortage": gap < 0,
    }


# ---------------------------------------------------------------------------
# 3. analyze_supplier
# ---------------------------------------------------------------------------

def analyze_supplier(sku: str) -> dict:
    row = _get_row(sku)
    if row is None:
        return {"error": f"SKU '{sku}' not found"}
    return {
        "sku": sku,
        "supplier": _safe(row["Supplier name"]),
        "supplier_location": _safe(row["Location"]),
        "lead_time": _safe(row["Lead time"], int),
        "manufacturing_lead_time": _safe(row["Manufacturing lead time"], int),
        "inspection_result": _safe(row["Inspection results"]),
        "defect_rate": _safe(row["Defect rates"], float),
    }


# ---------------------------------------------------------------------------
# 4. analyze_logistics
# ---------------------------------------------------------------------------

def analyze_logistics(sku: str) -> dict:
    row = _get_row(sku)
    if row is None:
        return {"error": f"SKU '{sku}' not found"}
    return {
        "sku": sku,
        "shipping_time": _safe(row["Shipping times"], int),
        "shipping_carrier": _safe(row["Shipping carriers"]),
        "shipping_cost": _safe(row["Shipping costs"], float),
        "transportation_mode": _safe(row["Transportation modes"]),
        "route": _safe(row["Routes"]),
        "logistics_cost": _safe(row["Costs"], float),
    }


# ---------------------------------------------------------------------------
# 5. calculate_supply_risk  (fully deterministic — no LLM)
# ---------------------------------------------------------------------------

def calculate_supply_risk(sku: str) -> dict:
    row = _get_row(sku)
    if row is None:
        return {"error": f"SKU '{sku}' not found"}

    stock = _safe(row["Stock levels"], int) or 0
    order = _safe(row["Order quantities"], int) or 0
    lead_time = _safe(row["Lead time"], int) or 0
    shipping_time = _safe(row["Shipping times"], int) or 0
    defect_rate = _safe(row["Defect rates"], float) or 0.0
    inspection = _safe(row["Inspection results"]) or ""

    score = 0
    reasons = []

    # --- inventory gap ---
    gap = stock - order
    if gap < 0:
        score += 3
        reasons.append(f"Stock shortage: stock={stock}, order={order}, gap={gap}")
    elif gap == 0:
        score += 2
        reasons.append("Stock exactly meets order quantity — no buffer")
    elif stock < order * 0.25:
        score += 1
        reasons.append(f"Low stock buffer: stock={stock} is <25% above order={order}")

    # --- lead time ---
    if lead_time >= 25:
        score += 2
        reasons.append(f"Very long lead time: {lead_time} days")
    elif lead_time >= 15:
        score += 1
        reasons.append(f"Long lead time: {lead_time} days")

    # --- shipping time ---
    if shipping_time >= 8:
        score += 2
        reasons.append(f"Very long shipping time: {shipping_time} days")
    elif shipping_time >= 5:
        score += 1
        reasons.append(f"Long shipping time: {shipping_time} days")

    # --- defect rate ---
    if defect_rate >= 4.0:
        score += 3
        reasons.append(f"Critical defect rate: {defect_rate:.2f}%")
    elif defect_rate >= 2.0:
        score += 2
        reasons.append(f"High defect rate: {defect_rate:.2f}%")
    elif defect_rate >= 1.0:
        score += 1
        reasons.append(f"Moderate defect rate: {defect_rate:.2f}%")

    # --- inspection result ---
    if inspection.strip().lower() == "fail":
        score += 3
        reasons.append("Inspection result: FAIL")
    elif inspection.strip().lower() == "pending":
        score += 1
        reasons.append("Inspection result: PENDING (unverified quality)")

    # --- classify ---
    if score >= 9:
        risk = "CRITICAL"
    elif score >= 6:
        risk = "HIGH"
    elif score >= 3:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "sku": sku,
        "risk_level": risk,
        "risk_score": score,
        "reasons": reasons if reasons else ["No significant risk factors detected"],
    }


# ---------------------------------------------------------------------------
# 6. find_risky_skus
# ---------------------------------------------------------------------------

def find_risky_skus(limit: int = 10) -> list[dict]:
    df = _load_df()
    results = []
    for sku in df["SKU"].astype(str):
        risk = calculate_supply_risk(sku)
        if "error" not in risk:
            results.append(risk)

    _order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    results.sort(key=lambda r: (_order.get(r["risk_level"], 4), -r["risk_score"]))
    return results[:limit]
