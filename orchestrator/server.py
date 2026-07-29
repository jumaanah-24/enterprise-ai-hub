"""
Enterprise AI Hub — Orchestrator API  (port 8003)
POST /run-incident  → triggers full 6-agent CrewAI pipeline
GET  /stream/{id}   → SSE live log stream
GET  /result/{id}   → fetch completed result
GET  /runs          → list all runs
"""

import asyncio, json, sys, uuid
from pathlib import Path
from datetime import datetime
import importlib.util

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load env before importing crew (crew.py needs GROQ_API_KEY at module level)
_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent
load_dotenv(_ROOT / "agent1-supply-chain" / ".env")

sys.path.insert(0, str(_ROOT))  # expose root for database.py
sys.path.insert(0, str(_HERE))  # so `import crew` resolves

from crew import run_pipeline, Incident  # noqa: E402 — must be after sys.path
from database import (
    init_db, save_pipeline_run, update_pipeline_run,
    save_risk_assessment, save_purchase_order, save_executive_report,
)

init_db()

# Import Agent 4, 5, 6 directly from their folders
def _import_from(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

_a4 = _import_from(_ROOT / "agent4-risk-forecasting" / "agent4.py", "agent4")
_a5 = _import_from(_ROOT / "agent5-procurement" / "agent5.py", "agent5")
_a6 = _import_from(_ROOT / "agent6-executive-briefing" / "agent6.py", "agent6")

RiskInput        = _a4.RiskInput
run_assessment   = _a4.run_assessment
ProcurementInput = _a5.ProcurementInput
run_procurement  = _a5.run_procurement
BriefingInput    = _a6.BriefingInput
run_briefing     = _a6.run_briefing

app = FastAPI(title="Enterprise AI Hub Orchestrator")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# run_id → { status, logs, result, incident }
_runs: dict[str, dict] = {}


class IncidentRequest(BaseModel):
    incident_id: str
    sku: str
    required_quantity: int


def _ts():
    return datetime.now().strftime("%H:%M:%S")


def _log(store, agent, msg, kind="info"):
    store["logs"].append({"ts": _ts(), "agent": agent, "msg": msg, "kind": kind})


async def _execute(run_id: str, req: IncidentRequest):
    store = _runs[run_id]
    _log(store, "Orchestrator", f"🚀 Pipeline started — Incident {req.incident_id}", "start")
    _log(store, "Orchestrator", f"SKU={req.sku}  Required Qty={req.required_quantity}", "info")
    _log(store, "Orchestrator", "Running 6-agent deterministic pipeline...", "info")

    # Persist run start
    save_pipeline_run(run_id, req.incident_id, req.sku, req.required_quantity)

    try:
        loop = asyncio.get_event_loop()

        # ── Agents 1–3 ────────────────────────────────────────────────────────
        _log(store, "Agent 1", "▶ Supply Chain Analyst activated", "agent")
        _log(store, "Agent 1", f"→ Collecting inventory data for {req.sku}", "tool")
        _log(store, "Agent 2", "▶ Budget & Finance Analyst activated", "agent")
        _log(store, "Agent 3", "▶ Vendor & Contract Specialist activated", "agent")

        result = await loop.run_in_executor(
            None, run_pipeline,
            Incident(incident_id=req.incident_id, sku=req.sku,
                     required_quantity=req.required_quantity),
        )

        a1 = result.get("agent1_supply_chain") or ""
        a2 = result.get("agent2_budget_finance") or ""
        a3 = result.get("agent3_vendor_contract") or ""
        supplier_name = result.get("supplier_name", "Supplier 1")

        _log(store, "Agent 1", "✅ Supply chain analysis complete", "done")
        _log(store, "Agent 1", a1[:400] + ("..." if len(a1) > 400 else ""), "output")
        _log(store, "Agent 2", "✅ Financial assessment complete", "done")
        _log(store, "Agent 2", a2[:400] + ("..." if len(a2) > 400 else ""), "output")
        _log(store, "Agent 3", "✅ Vendor & contract assessment complete", "done")
        _log(store, "Agent 3", a3[:400] + ("..." if len(a3) > 400 else ""), "output")

        # ── Parse outputs for Agent 4 input ───────────────────────────────────
        def _parse_json(raw: str) -> dict:
            try:
                s = raw.find("{"); e = raw.rfind("}") + 1
                return json.loads(raw[s:e]) if s != -1 else {}
            except Exception:
                return {}

        d1 = _parse_json(a1)
        d2 = _parse_json(a2)
        d3 = _parse_json(a3)

        # ── Agent 4 — Risk Assessment ─────────────────────────────────────────
        _log(store, "Agent 4", "▶ Risk Assessment & Forecasting activated", "agent")
        _log(store, "Agent 4", "→ Calculating composite risk score", "tool")
        _log(store, "Agent 4", "→ Forecasting delivery delay", "tool")
        _log(store, "Agent 4", "→ Evaluating supplier options", "tool")
        _log(store, "Agent 4", "→ Estimating financial impact", "tool")
        _log(store, "Agent 4", "→ Recommending optimal supplier", "tool")

        risk_input = RiskInput(
            incident_id       = req.incident_id,
            sku               = req.sku,
            inventory_risk    = d1.get("risk_level") or d1.get("inventory_risk", "HIGH"),
            shortage_quantity = int(d1.get("shortage_quantity") or req.required_quantity),
            has_shortage      = bool(d1.get("has_shortage", True)),
            supplier_name     = d1.get("supplier_name") or supplier_name,
            lead_time         = int(d1.get("lead_time") or 14),
            defect_rate       = float(d1.get("defect_rate") or 2.0),
            required_quantity = req.required_quantity,
            remaining_budget  = float(d2.get("remaining_budget") or 100_000),
            budget_allocated  = float(d2.get("allocated_budget") or d2.get("budget_allocated") or 200_000),
            purchase_feasible = bool(d2.get("purchase_feasible", True)),
            unit_cost         = float(d1.get("unit_cost") or 50.0),
            approved_vendor   = bool(d3.get("eligible_for_po", True)),
        )
        a4_result = await loop.run_in_executor(None, run_assessment, risk_input)
        _log(store, "Agent 4", "✅ Risk assessment complete", "done")
        _log(store, "Agent 4",
             f"Risk={a4_result.get('overall_risk')} Supplier={a4_result.get('recommended_supplier')}",
             "output")

        # ── Agent 5 — Procurement ─────────────────────────────────────────────
        _log(store, "Agent 5", "▶ Procurement & Workflow Execution activated", "agent")
        _log(store, "Agent 5", "→ Validating purchase request", "tool")
        _log(store, "Agent 5", "→ Checking approval requirements", "tool")
        _log(store, "Agent 5", "→ Generating Purchase Order", "tool")
        _log(store, "Agent 5", "→ Simulating ERP order creation", "tool")

        proc_input = ProcurementInput(
            incident_id          = req.incident_id,
            overall_risk         = a4_result.get("overall_risk", "HIGH"),
            recommended_supplier = a4_result.get("recommended_supplier", supplier_name),
            estimated_cost       = float(a4_result.get("estimated_cost", req.required_quantity * 50)),
            purchase_feasible    = bool(d2.get("purchase_feasible", True)),
            vendor_approved      = bool(d3.get("eligible_for_po", True)),
            confidence           = float(a4_result.get("risk_score", 75) / 100),
        )
        a5_result = await loop.run_in_executor(None, run_procurement, proc_input)
        _log(store, "Agent 5", "✅ Procurement workflow complete", "done")
        _log(store, "Agent 5",
             f"PO={a5_result.get('purchase_order_id')} Status={a5_result.get('execution_status')}",
             "output")

        # ── Agent 6 — Executive Briefing ──────────────────────────────────────
        _log(store, "Agent 6", "▶ Executive Briefing & Report Agent activated", "agent")
        _log(store, "Agent 6", "→ Generating executive summary", "tool")
        _log(store, "Agent 6", "→ Generating PDF report", "tool")
        _log(store, "Agent 6", "→ Preparing Slack & WhatsApp notifications", "tool")
        _log(store, "Agent 6", "→ Archiving report", "tool")

        brief_input = BriefingInput(
            incident_id      = req.incident_id,
            purchase_order_id = a5_result.get("purchase_order_id", "PO-UNKNOWN"),
            supplier         = a5_result.get("supplier", supplier_name),
            execution_status = a5_result.get("execution_status", "SUCCESS"),
            estimated_cost   = float(a5_result.get("estimated_cost", proc_input.estimated_cost)),
            approval_status  = a5_result.get("approval_status", "APPROVED"),
        )
        a6_result = await loop.run_in_executor(None, run_briefing, brief_input)
        _log(store, "Agent 6", "✅ Executive briefing complete", "done")
        _log(store, "Agent 6",
             f"Report={a6_result.get('report_file')} Dashboard={a6_result.get('dashboard_status')}",
             "output")

        _log(store, "Orchestrator", "🎯 All 6 agents completed. Pipeline finished.", "complete")

        store["status"] = "completed"
        store["result"] = {
            **result,
            "agent4_risk_assessment": a4_result,
            "agent5_procurement":     a5_result,
            "agent6_executive_brief": a6_result,
        }

        # Persist results to DB
        save_risk_assessment(run_id, req.incident_id, req.sku, a4_result)
        save_purchase_order(run_id, req.incident_id, a5_result)
        save_executive_report(run_id, req.incident_id, a6_result)
        update_pipeline_run(run_id, "completed")

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        _log(store, "Orchestrator", f"❌ Pipeline error: {str(e)}", "error")
        _log(store, "Orchestrator", tb[:600], "error")
        store["status"] = "failed"
        store["result"] = {"error": str(e), "traceback": tb}
        update_pipeline_run(run_id, "failed")


@app.post("/run-incident")
async def run_incident(req: IncidentRequest):
    run_id = str(uuid.uuid4())[:8]
    _runs[run_id] = {
        "status": "running",
        "logs": [],
        "result": None,
        "incident": req.model_dump(),
    }
    asyncio.create_task(_execute(run_id, req))
    return {"run_id": run_id, "status": "running", "incident": req.model_dump()}


@app.get("/stream/{run_id}")
async def stream_logs(run_id: str):
    async def generator():
        sent = 0
        while True:
            store = _runs.get(run_id)
            if not store:
                yield f"data: {json.dumps({'error': 'run not found'})}\n\n"
                break
            while sent < len(store["logs"]):
                yield f"data: {json.dumps(store['logs'][sent])}\n\n"
                sent += 1
            if store["status"] in ("completed", "failed"):
                yield f"data: {json.dumps({'done': True, 'status': store['status']})}\n\n"
                break
            await asyncio.sleep(0.4)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/result/{run_id}")
async def get_result(run_id: str):
    store = _runs.get(run_id)
    if not store:
        return {"error": "run not found"}
    return {"run_id": run_id, "status": store["status"], "result": store["result"]}


@app.get("/runs")
async def list_runs():
    return [
        {"run_id": k, "status": v["status"], "incident": v["incident"]}
        for k, v in _runs.items()
    ]


@app.get("/health")
def health():
    return {"status": "ok", "service": "orchestrator", "port": 8003}


_REPORTS_DIR = _ROOT / "agent6-executive-briefing" / "reports"


@app.get("/latest-report")
def latest_report():
    files = sorted(_REPORTS_DIR.glob("executive_report_*.pdf"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not files:
        return {"filename": None}
    return {"filename": files[0].name}


@app.get("/report/{filename}")
def download_report(filename: str):
    filepath = _REPORTS_DIR / filename
    if not filepath.exists() or not filepath.is_file():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Report not found")
    media_type = "application/pdf" if filename.endswith(".pdf") else "text/plain"
    return FileResponse(str(filepath), media_type=media_type, filename=filename)


@app.get("/latest-excel")
def latest_excel():
    files = sorted(_REPORTS_DIR.glob("executive_report_*.xlsx"), key=lambda f: f.stat().st_mtime, reverse=True)
    if not files:
        return {"filename": None}
    return {"filename": files[0].name}


@app.get("/excel/{filename}")
def download_excel(filename: str):
    filepath = _REPORTS_DIR / filename
    if not filepath.exists() or not filepath.is_file():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Excel report not found")
    return FileResponse(str(filepath),
                        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        filename=filename)
