"""
Agent 4 — Risk Assessment & Forecasting (fully deterministic, no LLM)
"""

import sys, importlib.util
from pathlib import Path
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "agent1-supply-chain" / ".env")

def _import_from(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod  = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

_rt = _import_from(Path(__file__).resolve().parent / "tools" / "risk_tools.py", "risk_tools")

calculate_risk_score      = _rt.calculate_risk_score
forecast_delay            = _rt.forecast_delay
evaluate_supplier_options = _rt.evaluate_supplier_options
estimate_financial_impact = _rt.estimate_financial_impact
recommend_supplier        = _rt.recommend_supplier

from pydantic import BaseModel


class RiskInput(BaseModel):
    incident_id:       str
    sku:               str
    inventory_risk:    str
    shortage_quantity: int
    has_shortage:      bool
    supplier_name:     str
    lead_time:         int
    defect_rate:       float
    required_quantity: int
    remaining_budget:  float
    budget_allocated:  float
    purchase_feasible: bool
    unit_cost:         float = 50.0
    approved_vendor:   bool


def run_assessment(inp: RiskInput) -> dict:
    risk_result    = calculate_risk_score(
        inp.inventory_risk, inp.remaining_budget, inp.purchase_feasible,
        inp.approved_vendor, inp.lead_time, inp.defect_rate, inp.budget_allocated,
    )
    delay_result   = forecast_delay(
        inp.supplier_name, inp.lead_time, inp.shortage_quantity, inp.has_shortage,
    )
    finance_result = estimate_financial_impact(
        inp.shortage_quantity, inp.unit_cost, inp.lead_time,
        inp.inventory_risk, inp.remaining_budget, inp.purchase_feasible,
    )
    rec_result     = recommend_supplier(
        inp.supplier_name, inp.inventory_risk, inp.required_quantity,
        inp.lead_time, inp.purchase_feasible, inp.approved_vendor,
    )

    return {
        "incident_id":          inp.incident_id,
        "sku":                  inp.sku,
        "overall_risk":         risk_result["overall_risk"],
        "risk_score":           risk_result["risk_score"],
        "recommended_supplier": rec_result["recommended_supplier"],
        "estimated_cost":       finance_result["total_estimated_cost"],
        "expected_delay":       delay_result["expected_delay_days"],
        "recommendation":       rec_result["rationale"],
        "_detail": {
            "risk_breakdown":   risk_result["sub_scores"],
            "delay_forecast":   delay_result,
            "financial_impact": finance_result,
            "supplier_options": rec_result["all_options"],
            "action":           rec_result["action"],
        },
    }
