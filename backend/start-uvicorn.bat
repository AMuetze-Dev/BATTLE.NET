@echo off
echo Starting Battle.Net Quiz Platform Backend...
echo.

REM Activate virtual environment
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

REM Start Uvicorn
echo Starting Uvicorn server...
uvicorn main:app --host 0.0.0.0 --port 8000 --reload