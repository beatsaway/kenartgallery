@echo off
echo Stopping any process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    if not "%%a"=="0" taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul
echo.
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop.
echo.
npx --yes serve -p 3000
