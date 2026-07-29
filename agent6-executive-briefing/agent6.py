"""
Agent 6 — Executive Briefing & Report Agent (fully deterministic, no LLM)
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

_bt = _import_from(Path(__file__).resolve().parent / "tools" / "briefing_tools.py", "briefing_tools")

generate_executive_summary    = _bt.generate_executive_summary
generate_incident_timeline    = _bt.generate_incident_timeline
generate_pdf_report           = _bt.generate_pdf_report
prepare_dashboard_summary     = _bt.prepare_dashboard_summary
prepare_slack_notification    = _bt.prepare_slack_notification
prepare_whatsapp_notification = _bt.prepare_whatsapp_notification
archive_report                = _bt.archive_report

from pydantic import BaseModel


class BriefingInput(BaseModel):
    incident_id:       str
    purchase_order_id: str
    supplier:          str
    execution_status:  str
    estimated_cost:    float
    approval_status:   str


def run_briefing(inp: BriefingInput) -> dict:
    summary_result = generate_executive_summary(
        inp.incident_id, inp.purchase_order_id, inp.supplier,
        inp.execution_status, inp.estimated_cost, inp.approval_status,
    )
    timeline = generate_incident_timeline(
        inp.incident_id, inp.purchase_order_id, inp.supplier,
        inp.execution_status, inp.approval_status,
    )
    pdf_result = generate_pdf_report(
        inp.incident_id, summary_result["executive_summary"],
        inp.purchase_order_id, inp.supplier, inp.estimated_cost,
        inp.approval_status, inp.execution_status, timeline,
    )
    slack_payload = prepare_slack_notification(
        inp.incident_id, inp.purchase_order_id, inp.supplier,
        inp.estimated_cost, inp.execution_status,
    )
    wa_payload = prepare_whatsapp_notification(
        inp.incident_id, inp.purchase_order_id, inp.supplier,
        inp.estimated_cost, inp.execution_status,
    )
    archive_report(
        inp.incident_id, pdf_result["report_file"],
        summary_result["executive_summary"], inp.execution_status,
    )

    return {
        "incident_id":       inp.incident_id,
        "executive_summary": summary_result["executive_summary"],
        "report_file":       pdf_result["report_file"],
        "dashboard_status":  "UPDATED",
        "slack_payload":     slack_payload,
        "whatsapp_payload":  wa_payload,
        "timeline":          timeline,
    }
