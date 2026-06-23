@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Starting FinTech Digital Wallet & Payments System
echo ===================================================

echo.
echo [1/3] Checking & Installing Dependencies...

rem Check Backend Dependencies
if not exist "backend\node_modules\" (
    echo [Backend] node_modules not found. Installing backend dependencies...
    cd backend
    call npm install
    cd ..
) else (
    echo [Backend] Backend dependencies already installed.
)

rem Check Frontend Dependencies
if not exist "digital-wallet\node_modules\" (
    echo [Frontend] node_modules not found. Installing frontend dependencies...
    cd digital-wallet
    call npm install
    cd ..
) else (
    echo [Frontend] Frontend dependencies already installed.
)

echo.
echo [2/3] Launching Backend Server on port 5000...
start cmd /k "echo --- Backend Log Feed --- && cd backend && npm run dev"

echo.
echo [3/3] Launching React Frontend...
start cmd /k "echo --- Frontend Log Feed --- && cd digital-wallet && npm run dev"

echo.
echo All services launched!
for /f "delims=" %%i in ('node -e "const os = require('os'); const interfaces = os.networkInterfaces(); let ip = 'localhost'; for (const name of Object.keys(interfaces)) { for (const net of interfaces[name]) { if (String(net.family).toLowerCase() === 'ipv4') { if (!net.internal) { ip = net.address; break; } } } if (ip !== 'localhost') break; } console.log(ip);"') do set IP_ADDR=%%i
if "%IP_ADDR%"=="" set IP_ADDR=localhost

echo.
echo [Local Access]
echo - Backend API:       http://localhost:5000
echo - Frontend client:   https://localhost:5173
echo.
if not "%IP_ADDR%"=="localhost" (
    echo [Network Access (Other Devices)]
    echo - Backend API:       http://%IP_ADDR%:5000
    echo - Frontend client:   https://%IP_ADDR%:5173
    echo.
    echo *Note: Tapping the link on mobile will show a "Your connection is not private" warning.*
    echo   Choose "Advanced" -> "Proceed" to allow the browser to request camera permissions for live QR scanning.
    echo.
)
echo Double-click to restart, or close the spawned command windows to stop the servers.
echo ===================================================
pause
