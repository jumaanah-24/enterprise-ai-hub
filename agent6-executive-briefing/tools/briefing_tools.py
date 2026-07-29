"""
Agent 6 — Deterministic reporting tools.
Generates executive summaries, PDFs, notification payloads, and archives.
"""

import json, uuid
from datetime import datetime
from pathlib import Path

_REPORTS_DIR = Path(__file__).resolve().parent.parent / "reports"
_REPORTS_DIR.mkdir(exist_ok=True)

_report_archive: list = []


def _ts() -> str:
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def _fmt_cost(cost: float) -> str:
    return f"${cost:,.0f}"


def generate_executive_summary(incident_id: str, purchase_order_id: str, supplier: str,
                                 execution_status: str, estimated_cost: float,
                                 approval_status: str) -> dict:
    status_line = "successfully completed" if execution_status == "SUCCESS" else "encountered issues"
    summary = (
        f"Incident {incident_id} has been {status_line}. "
        f"A purchase order ({purchase_order_id}) was issued to {supplier} "
        f"for an estimated value of {_fmt_cost(estimated_cost)}. "
        f"Approval status: {approval_status}. "
        f"The procurement workflow executed with status: {execution_status}."
    )
    return {
        "incident_id": incident_id,
        "executive_summary": summary,
        "generated_at": _ts(),
    }


def generate_incident_timeline(incident_id: str, purchase_order_id: str, supplier: str,
                                 execution_status: str, approval_status: str) -> list:
    now = datetime.utcnow()
    return [
        {"step": 1, "event": "Incident Detected",        "status": "COMPLETED", "timestamp": _ts()},
        {"step": 2, "event": "Supply Chain Analysis",    "status": "COMPLETED", "timestamp": _ts()},
        {"step": 3, "event": "Budget Assessment",        "status": "COMPLETED", "timestamp": _ts()},
        {"step": 4, "event": "Vendor Verification",      "status": "COMPLETED", "timestamp": _ts()},
        {"step": 5, "event": "Risk Assessment",          "status": "COMPLETED", "timestamp": _ts()},
        {"step": 6, "event": f"Approval ({approval_status})", "status": approval_status, "timestamp": _ts()},
        {"step": 7, "event": f"PO Generated ({purchase_order_id})", "status": "COMPLETED", "timestamp": _ts()},
        {"step": 8, "event": f"ERP Order Created",       "status": "COMPLETED", "timestamp": _ts()},
        {"step": 9, "event": f"Procurement {execution_status}", "status": execution_status, "timestamp": _ts()},
    ]


def generate_pdf_report(incident_id: str, executive_summary: str, purchase_order_id: str,
                          supplier: str, estimated_cost: float, approval_status: str,
                          execution_status: str, timeline: list) -> dict:
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

        filename = f"executive_report_{incident_id}_{uuid.uuid4().hex[:6]}.pdf"
        filepath = _REPORTS_DIR / filename

        doc = SimpleDocTemplate(str(filepath), pagesize=A4,
                                 leftMargin=2*cm, rightMargin=2*cm,
                                 topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("Enterprise AI Hub — Executive Report", styles["Title"]))
        story.append(Spacer(1, 0.4*cm))
        story.append(Paragraph(f"Incident: {incident_id} | Generated: {_ts()}", styles["Normal"]))
        story.append(Spacer(1, 0.6*cm))

        story.append(Paragraph("Executive Summary", styles["Heading2"]))
        story.append(Paragraph(executive_summary, styles["Normal"]))
        story.append(Spacer(1, 0.4*cm))

        story.append(Paragraph("Procurement Details", styles["Heading2"]))
        details = [
            ["Field", "Value"],
            ["Purchase Order", purchase_order_id],
            ["Supplier", supplier],
            ["Estimated Cost", _fmt_cost(estimated_cost)],
            ["Approval Status", approval_status],
            ["Execution Status", execution_status],
        ]
        t = Table(details, colWidths=[5*cm, 10*cm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a212c")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f5f5f5"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.4*cm))

        story.append(Paragraph("Incident Timeline", styles["Heading2"]))
        tl_data = [["Step", "Event", "Status", "Timestamp"]]
        for row in timeline:
            tl_data.append([str(row["step"]), row["event"], row["status"], row["timestamp"]])
        tl = Table(tl_data, colWidths=[1.5*cm, 6*cm, 3*cm, 5*cm])
        tl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
            ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f5f5f5"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(tl)

        doc.build(story)
        return {"report_file": filename, "report_path": str(filepath), "status": "GENERATED"}

    except ImportError:
        # ReportLab not installed — write a plain text fallback
        filename = f"executive_report_{incident_id}.txt"
        filepath = _REPORTS_DIR / filename
        filepath.write_text(
            f"EXECUTIVE REPORT\nIncident: {incident_id}\n\n{executive_summary}\n\n"
            f"PO: {purchase_order_id}\nSupplier: {supplier}\nCost: {_fmt_cost(estimated_cost)}\n"
            f"Approval: {approval_status}\nStatus: {execution_status}\n"
        )
        return {"report_file": filename, "report_path": str(filepath), "status": "GENERATED_TXT"}


def prepare_dashboard_summary(incident_id: str, purchase_order_id: str, supplier: str,
                                estimated_cost: float, execution_status: str,
                                approval_status: str) -> dict:
    return {
        "incident_id": incident_id,
        "purchase_order_id": purchase_order_id,
        "supplier": supplier,
        "estimated_cost": estimated_cost,
        "execution_status": execution_status,
        "approval_status": approval_status,
        "dashboard_status": "UPDATED",
        "updated_at": _ts(),
    }


def prepare_slack_notification(incident_id: str, purchase_order_id: str, supplier: str,
                                 estimated_cost: float, execution_status: str) -> dict:
    icon = "✅" if execution_status == "SUCCESS" else "❌"
    return {
        "channel": "#procurement-alerts",
        "text": f"{icon} *Procurement Complete* — Incident `{incident_id}`",
        "attachments": [{
            "color": "#22c55e" if execution_status == "SUCCESS" else "#ef4444",
            "fields": [
                {"title": "Purchase Order", "value": purchase_order_id, "short": True},
                {"title": "Supplier",       "value": supplier,          "short": True},
                {"title": "Estimated Cost", "value": _fmt_cost(estimated_cost), "short": True},
                {"title": "Status",         "value": execution_status,  "short": True},
            ],
            "footer": "Enterprise AI Hub",
            "ts": _ts(),
        }],
    }


def prepare_whatsapp_notification(incident_id: str, purchase_order_id: str, supplier: str,
                                    estimated_cost: float, execution_status: str) -> dict:
    icon = "✅" if execution_status == "SUCCESS" else "❌"
    return {
        "to": "+1-ENTERPRISE-OPS",
        "type": "text",
        "text": {
            "body": (
                f"{icon} *Enterprise AI Hub Alert*\n"
                f"Incident: {incident_id}\n"
                f"PO: {purchase_order_id}\n"
                f"Supplier: {supplier}\n"
                f"Cost: {_fmt_cost(estimated_cost)}\n"
                f"Status: {execution_status}"
            )
        },
    }


def archive_report(incident_id: str, report_file: str, executive_summary: str,
                    execution_status: str) -> dict:
    entry = {
        "archive_id": f"ARC-{uuid.uuid4().hex[:8].upper()}",
        "incident_id": incident_id,
        "report_file": report_file,
        "executive_summary": executive_summary[:200],
        "execution_status": execution_status,
        "archived_at": _ts(),
    }
    _report_archive.append(entry)
    return entry


def get_report_archive() -> list:
    return _report_archive
