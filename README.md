# Enterprise AI Hub

A multi-agent AI system for enterprise operations.

---

## Agent 1 — Supply Chain Intelligence

An AI-powered supply chain assistant that answers inventory questions using real data.

### Features
- SKU details, stock levels, availability
- Inventory gap & shortage calculation
- Supplier analysis (lead time, defect rate, inspection)
- Logistics analysis (shipping time, carrier, cost, route)
- Supply risk scoring (LOW / MEDIUM / HIGH / CRITICAL)
- Top risky SKUs across entire inventory
- Chat UI with suggested questions

### Tech Stack
- **Backend** — FastAPI + Groq (`openai/gpt-oss-120b`) + Pandas
- **Frontend** — Single HTML chat UI served by FastAPI
- **Data** — Kaggle Supply Chain Dataset (100 SKUs)

### Setup

```bash
cd agent1-supply-chain

# 1. Install dependencies
pip install fastapi uvicorn groq python-dotenv pandas

# 2. Add your Groq API key
cp .env.example .env
# Edit .env and set GROQ_API_KEY=your-key

# 3. Run
python -m uvicorn main:app --reload --port 8000
```

Open **http://localhost:8000** in your browser.

### Project Structure

```
agent1-supply-chain/
├── data/
│   └── supply_chain_data.csv
├── tools/
│   ├── __init__.py
│   └── supply_tools.py       # deterministic Pandas tools
├── frontend/
│   └── index.html            # chat UI
├── main.py                   # FastAPI + Groq agent
├── test_tools.py             # tool tests
└── .env.example
```

### Sample Questions
- Analyze SKU2
- Which SKU has the highest shortage?
- Show products with low stock
- Find suppliers with high lead time
- Which shipment has the highest delay?
- Summarize today's supply chain risks
