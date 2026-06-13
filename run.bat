@echo off
echo =======================================================
echo Skill Sync Analyser - Startup Script
echo =======================================================

echo.
echo [1/3] Checking dependencies...
python --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python.
    pause
    exit /b
)

call npm --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [WARNING] Node.js NPM is not installed or not in PATH.
    echo The backend will start, but the frontend requires Node.js to run.
    echo Please install Node.js from https://nodejs.org/
    echo.
)

echo [2/3] Starting Backend Server...
cd backend
IF NOT EXIST "venv\Scripts\activate.bat" (
    echo Creating Python Virtual Environment...
    python -m venv venv
)
start cmd /k "venv\Scripts\activate.bat && pip install -r requirements.txt && python -m spacy download en_core_web_sm && python seed.py && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo [3/3] Starting Frontend Server...
cd ../frontend
call npm --version >nul 2>&1
IF ERRORLEVEL 0 (
    echo Installing frontend dependencies...
    start cmd /k "npm install && npm run dev"
    echo.
    echo Both servers are starting up!
    echo Backend API: http://localhost:8000
    echo Frontend UI: http://localhost:5173
) ELSE (
    echo.
    echo Frontend could not be started automatically.
    echo Once you install Node.js, run:
    echo cd frontend ^&^& npm install ^&^& npm run dev
)

echo.
echo =======================================================
echo Press any key to close this terminal...
pause >nul
