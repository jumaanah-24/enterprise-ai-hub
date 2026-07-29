"""Enterprise AI Hub — Portal Server (port 8080)"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

app = FastAPI(title="Enterprise AI Hub Portal")
_DIR = Path(__file__).resolve().parent
_DIST = _DIR / "dist"

# Serve all static files from dist (assets, robot.png, etc.)
app.mount("/assets", StaticFiles(directory=str(_DIST / "assets")), name="assets")

@app.get("/robot.png")
def robot():
    return FileResponse(str(_DIST / "robot.png"))

@app.get("/health")
def health():
    return {"status": "ok", "service": "enterprise-ai-hub-portal"}

@app.get("/{full_path:path}")
def spa(full_path: str):
    """Serve React SPA — all routes fall back to index.html"""
    return FileResponse(str(_DIST / "index.html"))
