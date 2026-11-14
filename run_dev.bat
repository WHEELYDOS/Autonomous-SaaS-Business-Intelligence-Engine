@echo off
chcp 65001 >nul 2>&1
title Autonomous SaaS BI Engine - Dev Server

echo.
echo ========================================================
echo   Autonomous SaaS BI Engine - Development Server
echo ========================================================
echo.

cd /d "%~dp0"

REM ---- Check Python ----
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found! Install from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo [*] Python found:
python --version
echo.

REM ---- Check Node ----
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [*] Node.js found:
node --version
echo.

REM ---- Check pip packages ----
python -c "import fastapi, uvicorn" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [*] Installing Python dependencies...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install Python dependencies.
        pause
        exit /b 1
    )
)
echo [OK] Python dependencies ready.

REM ---- Check node_modules ----
if not exist "Frontend\node_modules" (
    echo [*] Installing frontend dependencies...
    cd Frontend
    call npm install
    cd ..
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install frontend dependencies.
        pause
        exit /b 1
    )
)
echo [OK] Frontend dependencies ready.

echo.
echo ========================================================
echo   Starting servers...
echo ========================================================
echo   Backend  -^> http://localhost:8000
echo   Frontend -^> http://localhost:5173
echo   API Docs -^> http://localhost:8000/docs
echo.
echo   Press Ctrl+C to stop both servers.
echo ========================================================
echo.

REM ---- Pick the right Python (venv or system) ----
if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" start_dev.py
) else if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" start_dev.py
) else (
    python start_dev.py
)

echo.
echo [*] Servers stopped.
pause
