"""
Enterprise AI Hub — Database helpers (psycopg2)
Schema is managed by Prisma. This module handles Python-side DB writes.
"""

import os
from pathlib import Path
from datetime import datetime

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / "agent1-supply-chain" / ".env")

_DATABASE_URL = os.getenv("DATABASE_URL")
if not _DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in .env")

# Decode %40 → @ so psycopg2 can parse the DSN correctly
_DSN = _DATABASE_URL.replace("%40", "@")

# If URL still has double @ (password contains @), parse manually
import re as _re
_m = _re.match(r"postgresql://([^:]+):(.+)@([^/]+)/(.*)", _DSN)
if _m:
    _user, _pwd, _host, _dbname = _m.groups()
    # re-split host/port
    _hp = _host.rsplit(":", 1)
    _DSN_KWARGS = dict(host=_hp[0], port=int(_hp[1]) if len(_hp) > 1 else 5432,
                       user=_user, password=_pwd, dbname=_dbname.split("?")[0])
else:
    _DSN_KWARGS = {"dsn": _DSN}


def get_conn():
    return psycopg2.connect(**_DSN_KWARGS)


def init_db():
    """No-op: schema is managed by Prisma migrations."""
    print("[DB] Prisma manages schema. Skipping SQLAlchemy init.")


# ── Pipeline run helpers ──────────────────────────────────────────────────────

def save_pipeline_run(run_id: str, incident_id: str, sku: str, required_qty: int):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO pipeline_runs (run_id, incident_id, sku, required_qty, status, created_at)
                   VALUES (%s, %s, %s, %s, 'running', %s)
                   ON CONFLICT (run_id) DO NOTHING""",
                (run_id, incident_id, sku, required_qty, datetime.utcnow()),
            )
        conn.commit()


def update_pipeline_run(run_id: str, status: str):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE pipeline_runs SET status=%s, completed_at=%s WHERE run_id=%s""",
                (status, datetime.utcnow(), run_id),
            )
        conn.commit()


def save_risk_assessment(run_id: str, incident_id: str, sku: str, result: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO risk_assessments
                   (run_id, incident_id, sku, overall_risk, risk_score,
                    recommended_supplier, estimated_cost, expected_delay, recommendation, created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    run_id, incident_id, sku,
                    result.get("overall_risk"),
                    float(result.get("risk_score", 0)),
                    result.get("recommended_supplier"),
                    float(result.get("estimated_cost", 0)),
                    int(result.get("expected_delay", 0)),
                    result.get("recommendation"),
                    datetime.utcnow(),
                ),
            )
        conn.commit()


def save_purchase_order(run_id: str, incident_id: str, result: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO purchase_orders
                   (run_id, incident_id, purchase_order_id, supplier,
                    estimated_cost, approval_status, execution_status, created_at)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                (
                    run_id, incident_id,
                    result.get("purchase_order_id", ""),
                    result.get("supplier", ""),
                    float(result.get("estimated_cost", 0)),
                    result.get("approval_status", ""),
                    result.get("execution_status", ""),
                    datetime.utcnow(),
                ),
            )
        conn.commit()


def save_executive_report(run_id: str, incident_id: str, result: dict):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO executive_reports
                   (run_id, incident_id, executive_summary, report_file, excel_file, created_at)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (
                    run_id, incident_id,
                    result.get("executive_summary", ""),
                    result.get("report_file", ""),
                    result.get("excel_file", ""),
                    datetime.utcnow(),
                ),
            )
        conn.commit()
