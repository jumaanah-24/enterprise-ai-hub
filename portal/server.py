"""Enterprise AI Hub — Portal Server (port 8080)"""

import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from database import get_conn

app = FastAPI(title="Enterprise AI Hub Portal")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

_DIR  = Path(__file__).resolve().parent
_DIST = _DIR / "react-app" / "dist"


# ── Auth models ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(req: RegisterRequest):
    if not req.name or not req.email or not req.password:
        raise HTTPException(400, "All fields are required.")
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    try:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id, name, email, role, created_at",
                    (req.name.strip(), req.email.strip().lower(), hashed),
                )
                row = cur.fetchone()
            conn.commit()
        return {"ok": True, "user": {"id": row[0], "name": row[1], "email": row[2], "role": row[3]}}
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(409, "Email already registered.")
        raise HTTPException(500, str(e))


@app.post("/auth/login")
def login(req: LoginRequest):
    DEMO = {
        "admin@enterprise.ai": {"password": "admin123", "name": "Admin", "role": "admin"},
        "user@enterprise.ai":  {"password": "user123",  "name": "User",  "role": "user"},
    }
    email = req.email.strip().lower()

    # Check demo accounts first
    if email in DEMO and DEMO[email]["password"] == req.password:
        d = DEMO[email]
        return {"ok": True, "user": {"id": 0, "name": d["name"], "email": email, "role": d["role"]}}

    # Check DB
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, password, role FROM users WHERE email=%s", (email,))
            row = cur.fetchone()

    if not row:
        raise HTTPException(401, "Invalid email or password.")
    if not bcrypt.checkpw(req.password.encode(), row[3].encode()):
        raise HTTPException(401, "Invalid email or password.")

    return {"ok": True, "user": {"id": row[0], "name": row[1], "email": row[2], "role": row[4]}}


@app.get("/health")
def health():
    return {"status": "ok", "service": "enterprise-ai-hub-portal"}


# ── Serve React SPA ───────────────────────────────────────────────────────────

if _DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(_DIST / "assets")), name="assets")

    @app.get("/robot.png")
    def robot():
        return FileResponse(str(_DIST / "robot.png"))

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        return FileResponse(str(_DIST / "index.html"))
