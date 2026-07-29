"""
Agent 1 — Supply Chain AI Backend
FastAPI + Groq tool-calling → deterministic supply_tools
"""

import json
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()

# Make sure tools/ is importable regardless of cwd
sys.path.insert(0, str(Path(__file__).resolve().parent))

from tools.supply_tools import (
    get_sku_details,
    calculate_inventory_gap,
    analyze_supplier,
    analyze_logistics,
    calculate_supply_risk,
    find_risky_skus,
)
from tools.supply_tools import _load_df   # for extra queries

from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="Supply Chain Agent 1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── serve frontend ──────────────────────────────────────────────────────────
_FRONTEND = Path(__file__).resolve().parent / "frontend"
app.mount("/static", StaticFiles(directory=str(_FRONTEND)), name="static")

@app.get("/")
def root():
    return FileResponse(str(_FRONTEND / "index.html"))

# ── extra deterministic helpers (not in supply_tools yet) ───────────────────

def get_highest_shortage(limit: int = 5) -> list[dict]:
    df = _load_df()
    df = df.copy()
    df["shortage"] = (df["Order quantities"] - df["Stock levels"]).clip(lower=0)
    top = df.nlargest(limit, "shortage")[
        ["SKU", "Product type", "Stock levels", "Order quantities", "shortage"]
    ]
    return top.to_dict(orient="records")


def get_low_stock_products(threshold: int = 20) -> list[dict]:
    df = _load_df()
    low = df[df["Stock levels"] <= threshold][
        ["SKU", "Product type", "Stock levels", "Order quantities", "Supplier name"]
    ].sort_values("Stock levels")
    return low.to_dict(orient="records")


def get_high_lead_time_suppliers(threshold: int = 20) -> list[dict]:
    df = _load_df()
    high = df[df["Lead time"] >= threshold][
        ["Supplier name", "Location", "SKU", "Lead time", "Manufacturing lead time"]
    ].sort_values("Lead time", ascending=False)
    return high.to_dict(orient="records")


def get_highest_shipping_delay(limit: int = 5) -> list[dict]:
    df = _load_df()
    top = df.nlargest(limit, "Shipping times")[
        ["SKU", "Product type", "Shipping times", "Shipping carriers",
         "Transportation modes", "Routes"]
    ]
    return top.to_dict(orient="records")


def get_supply_chain_summary() -> dict:
    df = _load_df()
    risky = find_risky_skus(100)
    critical = [r for r in risky if r["risk_level"] == "CRITICAL"]
    high     = [r for r in risky if r["risk_level"] == "HIGH"]
    medium   = [r for r in risky if r["risk_level"] == "MEDIUM"]
    low_risk = [r for r in risky if r["risk_level"] == "LOW"]

    df2 = df.copy()
    df2["shortage"] = (df2["Order quantities"] - df2["Stock levels"]).clip(lower=0)
    total_shortage = int(df2["shortage"].sum())
    fail_count = int((df["Inspection results"].str.lower() == "fail").sum())
    pending_count = int((df["Inspection results"].str.lower() == "pending").sum())

    return {
        "total_skus": len(df),
        "critical_risk_skus": len(critical),
        "high_risk_skus": len(high),
        "medium_risk_skus": len(medium),
        "low_risk_skus": len(low_risk),
        "total_shortage_units": total_shortage,
        "inspection_fail_count": fail_count,
        "inspection_pending_count": pending_count,
        "avg_lead_time_days": round(df["Lead time"].mean(), 1),
        "avg_defect_rate_pct": round(df["Defect rates"].mean(), 2),
        "top_critical_skus": [r["sku"] for r in critical[:5]],
    }


# ── OpenAI tool definitions ──────────────────────────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_sku_details",
            "description": "Get full details of a specific SKU including stock, supplier, logistics, inspection.",
            "parameters": {
                "type": "object",
                "properties": {"sku": {"type": "string", "description": "SKU identifier e.g. SKU2"}},
                "required": ["sku"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_inventory_gap",
            "description": "Calculate inventory gap and shortage quantity for a SKU.",
            "parameters": {
                "type": "object",
                "properties": {"sku": {"type": "string"}},
                "required": ["sku"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_supplier",
            "description": "Analyze supplier details for a SKU: lead time, defect rate, inspection result.",
            "parameters": {
                "type": "object",
                "properties": {"sku": {"type": "string"}},
                "required": ["sku"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_logistics",
            "description": "Analyze logistics for a SKU: shipping time, carrier, cost, route.",
            "parameters": {
                "type": "object",
                "properties": {"sku": {"type": "string"}},
                "required": ["sku"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_supply_risk",
            "description": "Calculate supply risk level (LOW/MEDIUM/HIGH/CRITICAL) for a SKU with reasons.",
            "parameters": {
                "type": "object",
                "properties": {"sku": {"type": "string"}},
                "required": ["sku"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_risky_skus",
            "description": "Find the top N highest-risk SKUs across the entire inventory.",
            "parameters": {
                "type": "object",
                "properties": {"limit": {"type": "integer", "default": 10}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_highest_shortage",
            "description": "Find SKUs with the highest shortage (order quantity exceeds stock).",
            "parameters": {
                "type": "object",
                "properties": {"limit": {"type": "integer", "default": 5}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_low_stock_products",
            "description": "Find all products with stock levels at or below a threshold.",
            "parameters": {
                "type": "object",
                "properties": {"threshold": {"type": "integer", "default": 20}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_high_lead_time_suppliers",
            "description": "Find suppliers with lead time above a threshold in days.",
            "parameters": {
                "type": "object",
                "properties": {"threshold": {"type": "integer", "default": 20}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_highest_shipping_delay",
            "description": "Find shipments with the longest shipping times.",
            "parameters": {
                "type": "object",
                "properties": {"limit": {"type": "integer", "default": 5}},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_supply_chain_summary",
            "description": "Get a full summary of today's supply chain: risk counts, shortages, inspection stats.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
]

TOOL_MAP: dict[str, Any] = {
    "get_sku_details": get_sku_details,
    "calculate_inventory_gap": calculate_inventory_gap,
    "analyze_supplier": analyze_supplier,
    "analyze_logistics": analyze_logistics,
    "calculate_supply_risk": calculate_supply_risk,
    "find_risky_skus": find_risky_skus,
    "get_highest_shortage": get_highest_shortage,
    "get_low_stock_products": get_low_stock_products,
    "get_high_lead_time_suppliers": get_high_lead_time_suppliers,
    "get_highest_shipping_delay": get_highest_shipping_delay,
    "get_supply_chain_summary": get_supply_chain_summary,
}

SYSTEM_PROMPT = """You are Supply Chain Agent 1, an expert AI assistant for an Enterprise AI Hub.
You have access to real supply chain inventory data with 100 SKUs.

Your job:
- Answer questions about inventory, suppliers, logistics, risk, and shortages
- Always call the appropriate tool to get real data before answering
- Present data clearly using bullet points, tables, or structured text
- Highlight critical issues (CRITICAL/HIGH risk, shortages, failed inspections) prominently
- Be concise but complete — give actionable insights, not just raw numbers
- When asked to "analyze" a SKU, call multiple tools to give a full picture
- Always mention the risk level when discussing any SKU

Never make up data. Always use the tools provided."""


# ── chat endpoint ────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


@app.post("/chat")
async def chat(req: ChatRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not api_key.startswith("gsk_"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured in .env file.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(req.history[-10:])  # keep last 10 turns for context
    messages.append({"role": "user", "content": req.message})

    # agentic loop — keep calling tools until Groq stops requesting them
    for _ in range(10):
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return {"reply": msg.content}

        # execute every tool call Groq requested
        messages.append(msg)
        for tc in msg.tool_calls:
            fn_name = tc.function.name
            fn_args = json.loads(tc.function.arguments or "{}")
            fn = TOOL_MAP.get(fn_name)
            if fn is None:
                result = {"error": f"Unknown tool: {fn_name}"}
            else:
                try:
                    result = fn(**fn_args)
                except Exception as e:
                    result = {"error": str(e)}

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, default=str),
            })

    return {"reply": "I was unable to complete the request after multiple attempts."}


@app.get("/health")
def health():
    return {"status": "ok", "agent": "supply-chain-agent-1"}
