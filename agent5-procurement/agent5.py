"""
Agent 5 — Procurement & Workflow Execution Agent
Triggered after Agent 4 completes. Executes the full procurement workflow.
No UI. No chatbot. No external ERP calls.
"""

import sys, json, importlib.util
from pathlib import Path
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / "agent1-supply-chain" / ".env")

def _import_from(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

_pt = _import_from(Path(__file__).resolve().parent / "tools" / "procurement_tools.py", "procurement_tools")

validate_purchase_request   = _pt.validate_purchase_request
check_approval_requirement  = _pt.check_approval_requirement
submit_for_approval         = _pt.submit_for_approval
approve_purchase            = _pt.approve_purchase
reject_purchase             = _pt.reject_purchase
generate_purchase_order     = _pt.generate_purchase_order
simulate_erp_order_creation = _pt.simulate_erp_order_creation
update_procurement_status   = _pt.update_procurement_status
log_procurement_activity    = _pt.log_procurement_activity
get_audit_log               = _pt.get_audit_log

from pydantic import BaseModel


# ── Input model ───────────────────────────────────────────────────────────────

class ProcurementInput(BaseModel):
    incident_id: str
    overall_risk: str
    recommended_supplier: str
    estimated_cost: float
    purchase_feasible: bool
    vendor_approved: bool
    confidence: float


# ── Pipeline entry point ──────────────────────────────────────────────────────

def run_procurement(inp: ProcurementInput) -> dict:
    # Run deterministic workflow directly — no LLM needed for structured tool calls
    validation = validate_purchase_request(
        inp.incident_id, inp.recommended_supplier, inp.estimated_cost,
        inp.purchase_feasible, inp.vendor_approved, inp.confidence,
    )
    approval_info = check_approval_requirement(inp.estimated_cost, inp.overall_risk)
    approval_status = "NOT_REQUIRED"
    po_id = ""

    if validation["valid"]:
        if approval_info["approval_required"]:
            apr = submit_for_approval(inp.incident_id, inp.recommended_supplier,
                                      inp.estimated_cost, inp.overall_risk)
            apr = approve_purchase(apr["approval_id"])
            approval_status = apr["status"]
        po = generate_purchase_order(inp.incident_id, inp.recommended_supplier,
                                      inp.estimated_cost, inp.overall_risk)
        po_id = po["purchase_order_id"]
        simulate_erp_order_creation(po_id, inp.recommended_supplier, inp.estimated_cost)
        update_procurement_status(inp.incident_id, "COMPLETED",
                                   "Procurement workflow completed successfully")
        log_procurement_activity(inp.incident_id, "WORKFLOW_COMPLETE",
                                  "All procurement steps executed successfully")
    else:
        update_procurement_status(inp.incident_id, "REJECTED",
                                   f"Validation failed: {validation['errors']}")
        approval_status = "REJECTED"

    execution_status = "SUCCESS" if validation["valid"] else "FAILED"

    return {
        "incident_id": inp.incident_id,
        "purchase_order_id": po_id,
        "supplier": inp.recommended_supplier,
        "status": "APPROVED" if execution_status == "SUCCESS" else "REJECTED",
        "approval_required": approval_info["approval_required"],
        "approval_status": approval_status,
        "estimated_cost": inp.estimated_cost,
        "execution_status": execution_status,
        "audit_log": get_audit_log(inp.incident_id),
    }
