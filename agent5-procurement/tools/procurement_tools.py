"""
Agent 5 — Deterministic procurement tools.
All logic is local; no external ERP calls.
"""

import uuid
from datetime import datetime

# In-memory state for this session
_procurement_db: dict = {}
_audit_log: list = []
_po_counter = 1000

APPROVAL_THRESHOLD = 50_000  # purchases above this require approval


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def validate_purchase_request(incident_id: str, supplier: str, estimated_cost: float,
                               purchase_feasible: bool, vendor_approved: bool,
                               confidence: float) -> dict:
    errors = []
    if not incident_id:
        errors.append("incident_id is required")
    if not supplier:
        errors.append("supplier is required")
    if estimated_cost <= 0:
        errors.append("estimated_cost must be positive")
    if not purchase_feasible:
        errors.append("purchase not feasible per budget agent")
    if not vendor_approved:
        errors.append("vendor not approved per contract agent")
    if confidence < 0.5:
        errors.append(f"confidence {confidence} below minimum threshold 0.5")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "validated_at": _ts(),
    }


def check_approval_requirement(estimated_cost: float, overall_risk: str) -> dict:
    requires = estimated_cost > APPROVAL_THRESHOLD or overall_risk in ("HIGH", "CRITICAL")
    return {
        "approval_required": requires,
        "reason": (
            f"Cost ${estimated_cost:,.0f} exceeds threshold ${APPROVAL_THRESHOLD:,}"
            if estimated_cost > APPROVAL_THRESHOLD
            else f"Risk level {overall_risk} mandates approval"
            if requires else "No approval required"
        ),
        "approver": "CFO" if estimated_cost > 100_000 else "Procurement Manager",
    }


def submit_for_approval(incident_id: str, supplier: str, estimated_cost: float,
                         overall_risk: str) -> dict:
    approval_id = f"APR-{uuid.uuid4().hex[:6].upper()}"
    record = {
        "approval_id": approval_id,
        "incident_id": incident_id,
        "supplier": supplier,
        "estimated_cost": estimated_cost,
        "overall_risk": overall_risk,
        "status": "PENDING",
        "submitted_at": _ts(),
    }
    _procurement_db[approval_id] = record
    log_procurement_activity(incident_id, "APPROVAL_SUBMITTED",
                              f"Approval {approval_id} submitted for ${estimated_cost:,.0f}")
    return record


def approve_purchase(approval_id: str) -> dict:
    record = _procurement_db.get(approval_id, {})
    if not record:
        return {"error": f"Approval {approval_id} not found", "status": "ERROR"}
    record["status"] = "APPROVED"
    record["approved_at"] = _ts()
    log_procurement_activity(record["incident_id"], "APPROVED",
                              f"Approval {approval_id} approved")
    return record


def reject_purchase(approval_id: str, reason: str = "Policy violation") -> dict:
    record = _procurement_db.get(approval_id, {})
    if not record:
        return {"error": f"Approval {approval_id} not found", "status": "ERROR"}
    record["status"] = "REJECTED"
    record["rejected_at"] = _ts()
    record["rejection_reason"] = reason
    log_procurement_activity(record["incident_id"], "REJECTED",
                              f"Approval {approval_id} rejected: {reason}")
    return record


def generate_purchase_order(incident_id: str, supplier: str, estimated_cost: float,
                             overall_risk: str) -> dict:
    global _po_counter
    _po_counter += 1
    po_id = f"PO-{_po_counter}"
    po = {
        "purchase_order_id": po_id,
        "incident_id": incident_id,
        "supplier": supplier,
        "estimated_cost": estimated_cost,
        "overall_risk": overall_risk,
        "status": "GENERATED",
        "created_at": _ts(),
    }
    _procurement_db[po_id] = po
    log_procurement_activity(incident_id, "PO_GENERATED",
                              f"Purchase Order {po_id} created for {supplier}")
    return po


def simulate_erp_order_creation(po_id: str, supplier: str, estimated_cost: float) -> dict:
    erp_ref = f"ERP-{uuid.uuid4().hex[:8].upper()}"
    result = {
        "erp_reference": erp_ref,
        "po_id": po_id,
        "supplier": supplier,
        "estimated_cost": estimated_cost,
        "erp_status": "ORDER_CREATED",
        "simulated_at": _ts(),
        "expected_delivery_days": 7,
    }
    if po_id in _procurement_db:
        _procurement_db[po_id]["erp_reference"] = erp_ref
        _procurement_db[po_id]["erp_status"] = "ORDER_CREATED"
    return result


def update_procurement_status(incident_id: str, status: str, notes: str = "") -> dict:
    record = {
        "incident_id": incident_id,
        "status": status,
        "notes": notes,
        "updated_at": _ts(),
    }
    _procurement_db[f"STATUS-{incident_id}"] = record
    log_procurement_activity(incident_id, "STATUS_UPDATE", f"Status → {status}. {notes}")
    return record


def log_procurement_activity(incident_id: str, action: str, detail: str) -> dict:
    entry = {
        "incident_id": incident_id,
        "action": action,
        "detail": detail,
        "timestamp": _ts(),
    }
    _audit_log.append(entry)
    return entry


def get_audit_log(incident_id: str) -> list:
    return [e for e in _audit_log if e["incident_id"] == incident_id]
