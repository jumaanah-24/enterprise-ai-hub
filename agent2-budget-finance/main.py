"""
Agent 2 — Budget & Financial Analytics Backend
FastAPI + Groq tool-calling → deterministic budget_tools
"""

import json, sys, os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
sys.path.insert(0, str(Path(__file__).resolve().parent))

from tools.budget_tools import (
    get_remaining_budget, check_purchase_feasibility,
    get_budget_utilization, detect_cost_anomalies,
    get_department_expenses, get_procurement_summary,
    get_cloud_cost_trend, get_budget_summary,
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = FastAPI(title="Budget Finance Agent 2")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_FRONTEND = Path(__file__).resolve().parent / "frontend"
app.mount("/static", StaticFiles(directory=str(_FRONTEND)), name="static")

@app.get("/")
def root(): return FileResponse(str(_FRONTEND / "index.html"))

TOOLS = [
    {"type":"function","function":{"name":"get_remaining_budget","description":"Get remaining budget for a department or all departments.","parameters":{"type":"object","properties":{"department":{"type":"string","description":"Department name, optional"}},"required":[]}}},
    {"type":"function","function":{"name":"check_purchase_feasibility","description":"Check if a department can afford a purchase given their remaining budget.","parameters":{"type":"object","properties":{"department":{"type":"string"},"amount":{"type":"number"},"item":{"type":"string"}},"required":["department","amount"]}}},
    {"type":"function","function":{"name":"get_budget_utilization","description":"Get budget utilization percentages across departments, optionally filtered by category.","parameters":{"type":"object","properties":{"category":{"type":"string"}},"required":[]}}},
    {"type":"function","function":{"name":"detect_cost_anomalies","description":"Detect budget anomalies: over-budget departments, large pending purchases, unapproved expenses.","parameters":{"type":"object","properties":{"threshold_pct":{"type":"number","default":85}},"required":[]}}},
    {"type":"function","function":{"name":"get_department_expenses","description":"Get expense breakdown for a department or all departments.","parameters":{"type":"object","properties":{"department":{"type":"string"}},"required":[]}}},
    {"type":"function","function":{"name":"get_procurement_summary","description":"Get procurement/purchase summary, optionally filtered by department or status.","parameters":{"type":"object","properties":{"department":{"type":"string"},"status":{"type":"string"}},"required":[]}}},
    {"type":"function","function":{"name":"get_cloud_cost_trend","description":"Get monthly cloud cost trend across AWS, Azure, GCP vs budget limit.","parameters":{"type":"object","properties":{},"required":[]}}},
    {"type":"function","function":{"name":"get_budget_summary","description":"Get a full financial summary across all departments including totals and alerts.","parameters":{"type":"object","properties":{},"required":[]}}},
]

TOOL_MAP: dict[str, Any] = {
    "get_remaining_budget": get_remaining_budget,
    "check_purchase_feasibility": check_purchase_feasibility,
    "get_budget_utilization": get_budget_utilization,
    "detect_cost_anomalies": detect_cost_anomalies,
    "get_department_expenses": get_department_expenses,
    "get_procurement_summary": get_procurement_summary,
    "get_cloud_cost_trend": get_cloud_cost_trend,
    "get_budget_summary": get_budget_summary,
}

SYSTEM_PROMPT = """You are Budget & Finance Agent 2, an expert AI assistant for enterprise financial analytics.
You have access to real budget, procurement, expense, and cloud cost data.

Your job:
- Answer questions about department budgets, spending, procurement, and cloud costs
- Always call the appropriate tool to get real data before answering
- Flag over-budget departments and anomalies prominently
- Present financial data clearly with amounts in USD ($)
- Give actionable recommendations (e.g. reallocate budget, defer purchases)
- When checking purchase feasibility, always state APPROVED or REJECTED clearly

Never make up financial data. Always use the tools provided."""

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

@app.post("/chat")
async def chat(req: ChatRequest):
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured.")
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(req.history[-10:])
    messages.append({"role": "user", "content": req.message})
    for _ in range(10):
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b", messages=messages, tools=TOOLS, tool_choice="auto"
        )
        msg = response.choices[0].message
        if not msg.tool_calls:
            return {"reply": msg.content}
        messages.append(msg)
        for tc in msg.tool_calls:
            fn = TOOL_MAP.get(tc.function.name)
            args = json.loads(tc.function.arguments or "{}")
            try:
                result = fn(**args) if fn else {"error": f"Unknown tool: {tc.function.name}"}
            except Exception as e:
                result = {"error": str(e)}
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": json.dumps(result, default=str)})
    return {"reply": "Unable to complete request."}

@app.get("/health")
def health(): return {"status": "ok", "agent": "budget-finance-agent-2"}
