@echo off
title Garments QMS ERP - Central Host Server
color 0A
cls
echo =========================================================================
echo              VALIANT GARMENTS QMS ERP - CENTRAL HOST LAUNCHER            
echo =========================================================================
echo.

:: Detect Host Wi-Fi / LAN IP Address
for /f "tokens=*" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "([System.Net.Dns]::GetHostAddresses([System.Environment]::MachineName) | Where-Object AddressFamily -eq 'InterNetwork' | Select-Object -ExpandProperty IPAddressToString -First 1)"') do set HOST_IP=%%a

if "%HOST_IP%"=="" (
    set HOST_IP=127.0.0.1
)

:: Verify Windows Firewall rule for port 3000
netsh advfirewall firewall show rule name="Garments ERP Host Port 3000" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Checking Windows Firewall rule for Port 3000...
    netsh advfirewall firewall add rule name="Garments ERP Host Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>&1
    if %errorlevel% neq 0 (
        echo [!] NOTE: If mobile devices cannot connect, double-click:
        echo           setup-firewall-as-admin.bat
    ) else (
        echo [OK] Firewall rule created for Port 3000.
    )
) else (
    echo [OK] Windows Firewall rule verified for Port 3000.
)

:: Verify and auto-start MySQL Server if not running on port 3306
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Checking MySQL Server on localhost:3306...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [*] Starting local XAMPP MySQL Server in background...
        start "" /b "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 >nul
    ) else (
        net start MySQL80 >nul 2>&1
        if %errorlevel% neq 0 (
            net start mysql >nul 2>&1
        )
    )
)

echo.
echo =========================================================================
echo   HOST PC CONNECTION ADDRESSES:
echo   - From this Host PC:                http://localhost:3000
echo   - From Any Mobile or Other PC:      http://%HOST_IP%:3000
echo   - Real-Time WebSocket Sync:         ws://%HOST_IP%:3000/ws
echo.
echo   MOBILE ACCESS INSTRUCTIONS (ON SAME WI-FI):
echo   1. Ensure your mobile phone is connected to the same Wi-Fi.
echo   2. Open Chrome or Safari on your phone.
echo   3. In the address bar, type:
echo.
echo          http://%HOST_IP%:3000
echo.
echo   4. IMPORTANT:
echo      - MUST include "http://" (do NOT use https://).
echo      - Do NOT use "localhost" on your phone.
echo      - If mobile cannot connect, run setup-firewall-as-admin.bat
echo.
echo   CENTRAL DATABASE STORAGE:
echo   - Production Engine:                MySQL Host Database (garments_erp)
echo   - Local Backup Snapshot:            data\erp-central-store.json
echo   - To Initialize / Migrate MySQL:    Run setup-mysql-database.bat
echo =========================================================================
echo.
echo Starting Garments QMS ERP Central Server on 0.0.0.0:3000...
echo.

set NODE_OPTIONS=--no-deprecation
npm.cmd run dev:server
pause
