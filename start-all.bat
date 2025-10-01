@echo off
echo Starting both frontend and backend servers...
echo.

echo Starting backend (Next.js) on http://localhost:3000...
start "Backend Server" cmd /k "cd /d "%~dp0summarit" && npm run dev"

echo Starting frontend (Vite) on http://localhost:5173...
start "Frontend Server" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
