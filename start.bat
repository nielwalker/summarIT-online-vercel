@echo off
echo ========================================
echo Starting Student Practicum Report System
echo ========================================
echo.

echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "cd summarit && npm run dev"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 5173)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo The application will open automatically.
echo Close the command windows to stop the servers.
echo.
pause