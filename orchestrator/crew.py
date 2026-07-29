"""
Enterprise AI Hub — Orchestrator (fully deterministic, no LLM for tool calls)
Agents 1-3 run their tools directly — no CrewAI/Groq involved.
"""

import sys, json, importlib.util
from pathlib import Path
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "agent1-supply-chain" / ".env")


def _import_from(file_path: Path, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = mod
    spec.loader.exec_module(mod)
    return mod


_supply   = _import_from(_ROOT / "agent1-supply-chain"   / "tools" / "supply_tools.py",   "supply_tools")
_budget   = _import_from(_ROOT / "agent2-budget-finance"  / "tools" / "budget_tools.py",   "budget_tools")
_contract = _import_from(_ROOT / "agent3-vendor-contract" / "tools" / "contract_tools.py", "contract_tools")

from pydantic import BaseModel

# ── Supplier → Contract vendor mapping ───────────────────────────────────────
_SUPPLIER_VENDOR_MAP = {
    "supplier 1": "Dell Technologies",
    "supplier 2": "Cisco Systems",
    "supplier 3": "NVIDIA",
    "supplier 4": "FedEx",
    "supplier 5": "Oracle",
}

def _resolve_vendor(supplier_name: str) -> str:
    return _SUPPLIER_VENDOR_MAP.get(supplier_name.strip().lower(), "Dell Technologies")


class Incident(BaseModel):
    incident_id: str
    sku: str
    required_quantity: int


def run_pipeline(incident: Incident) -> dict:
    sku = incident.sku
    qty = incident.required_quantity

    # ── Agent 1 — Supply Chain (deterministic) ────────────────────────────────
    sku_details   = _supply.get_sku_details(sku)
    inv_gap       = _supply.calculate_inventory_gap(sku)
    supplier_info = _supply.analyze_supplier(sku)
    logistics     = _supply.analyze_logistics(sku)
    risk          = _supply.calculate_supply_risk(sku)

    supplier_name = sku_details.get("supplier_name", "Supplier 1")
    lead_time     = sku_details.get("lead_time", 14)
    defect_rate   = sku_details.get("defect_rate", 2.0) or 2.0
    unit_cost     = 50.0  # default; supply CSV has no unit cost column

    a1_result = {
        "incident_id":       incident.incident_id,
        "sku":               sku,
        "product_type":      sku_details.get("product_type"),
        "stock_levels":      sku_details.get("stock_levels"),
        "order_quantities":  sku_details.get("order_quantities"),
        "inventory_gap":     inv_gap.get("inventory_gap"),
        "shortage_quantity": inv_gap.get("shortage_quantity", 0),
        "has_shortage":      inv_gap.get("has_shortage", False),
        "supplier_name":     supplier_name,
        "supplier_location": supplier_info.get("supplier_location"),
        "lead_time":         lead_time,
        "manufacturing_lead_time": supplier_info.get("manufacturing_lead_time"),
        "defect_rate":       defect_rate,
        "inspection_result": supplier_info.get("inspection_result"),
        "shipping_time":     logistics.get("shipping_time"),
        "shipping_carrier":  logistics.get("shipping_carrier"),
        "shipping_cost":     logistics.get("shipping_cost"),
        "transportation_mode": logistics.get("transportation_mode"),
        "route":             logistics.get("route"),
        "risk_level":        risk.get("risk_level"),
        "risk_score":        risk.get("risk_score"),
        "risk_reasons":      risk.get("reasons"),
        "unit_cost":         unit_cost,
    }

    # ── Agent 2 — Budget & Finance (deterministic) ────────────────────────────
    purchase_amount  = qty * unit_cost
    budget_summary   = _budget.get_budget_summary()
    remaining_budget = _budget.get_remaining_budget("Operations")
    feasibility      = _budget.check_purchase_feasibility("Operations", purchase_amount, f"Restock {sku}")
    anomalies        = _budget.detect_cost_anomalies()

    remaining_val    = remaining_budget.get("remaining_budget", 100_000)
    allocated_val    = remaining_budget.get("allocated_budget", 200_000)

    a2_result = {
        "incident_id":      incident.incident_id,
        "department":       "Operations",
        "allocated_budget": allocated_val,
        "spent_budget":     remaining_budget.get("spent_budget", 0),
        "remaining_budget": remaining_val,
        "percent_used":     remaining_budget.get("percent_used"),
        "budget_status":    remaining_budget.get("status"),
        "requested_amount": purchase_amount,
        "purchase_feasible": feasibility.get("feasible", True),
        "verdict":          feasibility.get("verdict"),
        "shortfall":        feasibility.get("shortfall", 0),
        "anomaly_count":    anomalies.get("anomaly_count", 0) if isinstance(anomalies, dict) else 0,
        "recommendation":   feasibility.get("recommendation", "Proceed with purchase"),
    }

    # ── Agent 3 — Vendor & Contract (deterministic) ───────────────────────────
    vendor_name = _resolve_vendor(supplier_name)
    policy      = _contract.search_policy("emergency procurement compliance")
    contract_raw = _contract.get_contract_details(vendor=vendor_name)
    # get_contract_details returns a list when searching by vendor name
    contract    = contract_raw[0] if isinstance(contract_raw, list) and contract_raw else (contract_raw if isinstance(contract_raw, dict) else {})
    compliance  = _contract.check_vendor_compliance(vendor_name)
    sla         = _contract.get_sla_terms(vendor_name)
    payment     = _contract.get_payment_terms(vendor_name)
    eligibility = _contract.check_vendor_eligibility(vendor_name)

    a3_result = {
        "incident_id":       incident.incident_id,
        "supplier_name":     supplier_name,
        "vendor_name":       vendor_name,
        "contract_id":       contract.get("contract_id"),
        "contract_status":   contract.get("status"),
        "contract_value":    contract.get("value"),
        "days_until_expiry": compliance.get("days_until_expiry"),
        "sla_uptime":        sla.get("sla_uptime_pct"),
        "sla_response_hours": sla.get("sla_response_hours"),
        "sla_grade":         sla.get("sla_grade"),
        "payment_terms":     payment.get("payment_terms"),
        "penalty_clause":    sla.get("penalty_clause"),
        "compliant":         compliance.get("compliant", True),
        "compliance_issues": compliance.get("compliance_issues", []),
        "eligible_for_po":   eligibility.get("eligible", True),
        "recommendation":    eligibility.get("recommendation", "Proceed with PO"),
    }

    return {
        "incident_id":          incident.incident_id,
        "sku":                  sku,
        "supplier_name":        supplier_name,
        "vendor_name":          vendor_name,
        "pipeline":             "completed",
        "agent1_supply_chain":  json.dumps(a1_result),
        "agent2_budget_finance": json.dumps(a2_result),
        "agent3_vendor_contract": json.dumps(a3_result),
    }
