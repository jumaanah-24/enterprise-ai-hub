"""
Agent 3 — Vendor & Contract Policy Backend
FastAPI + Groq tool-calling → RAG + deterministic contract_tools
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

from tools.contract_tools import (
    search_policy, get_contract_details, check_vendor_compliance,
    get_sla_terms, get_payment_terms, check_vendor_eligibility,
    get_expiring_contracts, get_vendor_summary,
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
app = FastAPI(title="Vendor Contract Agent 3")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_FRONTEND = Path(__file__).resolve().parent / "frontend"
app.mount("/static", StaticFiles(directory=str(_FRONTEND)), name="static")

@app.get("/")
def root(): return FileResponse(str(_FRONTEND / "index.html"))

TOOLS = [
    {"type":"function","function":{"name":"search_policy","description":"Search the vendor policy document using RAG to answer policy questions about compliance, SLA standards, payment rules, eligibility criteria, etc.","parameters":{"type":"object","properties":{"query":{"type":"string"},"top_k":{"type":"integer","default":4}},"required":["query"]}}},
    {"type":"function","function":{"name":"get_contract_details","description":"Get full contract details for a vendor or contract ID.","parameters":{"type":"object","properties":{"vendor":{"type":"string"},"contract_id":{"type":"string"}},"required":[]}}},
    {"type":"function","function":{"name":"check_vendor_compliance","description":"Check if a vendor's contract is compliant, active, and not expiring soon.","parameters":{"type":"object","properties":{"vendor":{"type":"string"}},"required":["vendor"]}}},
    {"type":"function","function":{"name":"get_sla_terms","description":"Get SLA terms for a vendor: uptime, response time, penalties.","parameters":{"type":"object","properties":{"vendor":{"type":"string"}},"required":["vendor"]}}},
    {"type":"function","function":{"name":"get_payment_terms","description":"Get payment terms for a vendor or all vendors.","parameters":{"type":"object","properties":{"vendor":{"type":"string"}},"required":[]}}},
    {"type":"function","function":{"name":"check_vendor_eligibility","description":"Check if a vendor is eligible for new purchase orders.","parameters":{"type":"object","properties":{"vendor":{"type":"string"}},"required":["vendor"]}}},
    {"type":"function","function":{"name":"get_expiring_contracts","description":"Get contracts expiring within a given number of days and all expired contracts.","parameters":{"type":"object","properties":{"days_threshold":{"type":"integer","default":90}},"required":[]}}},
    {"type":"function","function":{"name":"get_vendor_summary","description":"Get a full summary of all vendor contracts: totals, values, expiry status.","parameters":{"type":"object","properties":{},"required":[]}}},
]

TOOL_MAP: dict[str, Any] = {
    "search_policy": search_policy,
    "get_contract_details": get_contract_details,
    "check_vendor_compliance": check_vendor_compliance,
    "get_sla_terms": get_sla_terms,
    "get_payment_terms": get_payment_terms,
    "check_vendor_eligibility": check_vendor_eligibility,
    "get_expiring_contracts": get_expiring_contracts,
    "get_vendor_summary": get_vendor_summary,
}

SYSTEM_PROMPT = """You are Vendor & Contract Policy Agent 3, an expert AI assistant for enterprise vendor management.
You have access to vendor contracts database and the full company vendor policy document (via RAG search).

Your job:
- Answer questions about vendor contracts, SLAs, payment terms, compliance, and policy
- Use search_policy for any policy/rule questions (what does policy say about X)
- Use contract tools for specific vendor or contract data
- Flag expired contracts, SLA violations, and compliance issues prominently
- Always state vendor eligibility clearly (ELIGIBLE / NOT ELIGIBLE)
- Recommend actions: renew contract, initiate RFP, escalate to Legal, etc.

Never make up contract data. Always use the tools provided."""

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
def health(): return {"status": "ok", "agent": "vendor-contract-agent-3"}
