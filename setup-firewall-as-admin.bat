@echo off
title Configure Network and Firewall for Mobile Access - Garments ERP
color 0B
cls

echo =========================================================================
echo    GARMENTS QMS ERP - MOBILE AND LAN ACCESS CONFIGURATION (PORT 3000)    
echo =========================================================================
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Administrator privileges required to configure Network and Firewall.
    echo [*] Requesting UAC elevation...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

echo [1/3] Setting Network Connection Profile to 'Private' (enables local LAN sharing)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetConnectionProfile | ForEach-Object { if ($_.NetworkCategory -ne 'Private') { Set-NetConnectionProfile -InterfaceIndex $_.InterfaceIndex -NetworkCategory Private -ErrorAction SilentlyContinue; Write-Host ('    [OK] Network profile for interface ''' + $_.InterfaceAlias + ''' changed to Private.') } else { Write-Host ('    [OK] Interface ''' + $_.InterfaceAlias + ''' is already Private.') } }"

echo.
echo [2/3] Configuring Windows Defender Firewall for Port 3000 (TCP Inbound)...
netsh advfirewall firewall delete rule name="Garments ERP Host Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Garments ERP Host Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] Inbound rule for Port 3000 added (Profiles: All/Any).
) else (
    echo     [!] Warning: Could not configure port 3000 rule.
)

echo.
echo [3/3] Allowing ICMPv4 (Ping) for easy connection testing...
netsh advfirewall firewall delete rule name="Garments ERP Ping Echo" >nul 2>&1
netsh advfirewall firewall add rule name="Garments ERP Ping Echo" dir=in action=allow protocol=ICMPv4 profile=any >nul 2>&1
if %errorlevel% equ 0 (
    echo     [OK] Inbound Ping (ICMPv4) allowed across local network.
)

:: Detect primary LAN IP
for /f "tokens=*" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "([System.Net.Dns]::GetHostAddresses([System.Environment]::MachineName) | Where-Object AddressFamily -eq 'InterNetwork' | Select-Object -ExpandProperty IPAddressToString -First 1)"') do set HOST_IP=%%a

if "%HOST_IP%"=="" set HOST_IP=127.0.0.1

echo.
echo =========================================================================
echo                     SUCCESSFULLY CONFIGURED!                             
echo =========================================================================
echo.
echo   YOUR HOST PC LAN IP:   %HOST_IP%
echo.
echo   HOW TO OPEN ON YOUR MOBILE PHONE:
echo   -----------------------------------------------------------------------
echo   1. Ensure your phone is connected to the SAME Wi-Fi network.
echo   2. Open Chrome or Safari on your phone.
echo   3. In the address bar, type EXACTLY:
echo.
echo          http://%HOST_IP%:3000
echo.
echo   -----------------------------------------------------------------------
echo   CRITICAL TIPS IF MOBILE STILL CANNOT REACH IT:
echo   a) DO NOT type https:// (typing https:// will show an error).
echo   b) DO NOT type localhost:3000 (localhost only works on the PC).
echo   c) If using mobile data (4G/5G), turn it OFF so your phone uses Wi-Fi.
echo   d) If your router has 'AP Isolation' or 'Guest Network', connect both
echo      PC and phone to the main Wi-Fi SSID.
echo =========================================================================
echo.
pause
