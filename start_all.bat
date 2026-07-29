@echo off
echo ============================================
echo   Enterprise AI Hub — Starting All Services
echo ============================================

cd /d "%~dp0"

where py >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PYTHON_CMD=py -3"
) else (
    set "PYTHON_CMD=python"
)

echo [0/5] Building React portal...
cd /d "%~dp0portal\react-app"
call npm run build
cd /d "%~dp0"

echo [1/5] Starting Agent 1 — Supply Chain (port 8000)...
start "Agent1-SupplyChain" cmd /k "cd /d ""%~dp0agent1-supply-chain"" && %PYTHON_CMD% -m uvicorn main:app --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/5] Starting Agent 2 — Budget Finance (port 8001)...
start "Agent2-BudgetFinance" cmd /k "cd /d ""%~dp0agent2-budget-finance"" && %PYTHON_CMD% -m uvicorn main:app --port 8001 --reload"

timeout /t 2 /nobreak >nul

echo [3/5] Starting Agent 3 — Vendor Contract (port 8002)...
start "Agent3-VendorContract" cmd /k "cd /d ""%~dp0agent3-vendor-contract"" && %PYTHON_CMD% -m uvicorn main:app --port 8002 --reload"

timeout /t 2 /nobreak >nul

echo [4/5] Starting Orchestrator (port 8003) — Agents 1-6 pipeline...
start "Orchestrator" cmd /k "cd /d ""%~dp0orchestrator"" && %PYTHON_CMD% -m uvicorn server:app --port 8003 --reload"

timeout /t 3 /nobreak >nul

echo [5/5] Starting Portal (port 8080)...
start "Portal" cmd /k "cd /d ""%~dp0portal"" && %PYTHON_CMD% -m uvicorn server:app --port 8080 --reload"

timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo   All services started!
echo   Portal:       http://localhost:8080
echo   Agent 1:      http://localhost:8000
echo   Agent 2:      http://localhost:8001
echo   Agent 3:      http://localhost:8002
echo   Orchestrator: http://localhost:8003
echo.
echo   Agents 4, 5, 6 run autonomously inside
echo   the orchestrator pipeline (no separate port).
echo.
echo   Optional: pip install reportlab
echo   (for PDF reports from Agent 6)
echo ============================================
echo.
start "" "http://localhost:8080"
pause
