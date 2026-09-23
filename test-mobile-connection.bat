@echo off
title Garments QMS ERP - Mobile and Wi-Fi Connection Diagnostic Tool
color 0E
cls

echo =========================================================================
echo      GARMENTS QMS ERP - MOBILE AND WI-FI CONNECTION DIAGNOSTIC TOOL      
echo =========================================================================
echo.

echo [*] Checking ERP Server status on Port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($c) { Write-Host '    [PASS] ERP Server is actively listening on Port 3000 (PID ' $c.OwningProcess ')' -ForegroundColor Green } else { Write-Host '    [FAIL] No server listening on Port 3000! Start the server first with start-erp-host.bat' -ForegroundColor Red }"

echo.
echo [*] Checking Host PC Network Category (Private vs Public)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-NetConnectionProfile; foreach ($prof in $p) { if ($prof.NetworkCategory -eq 'Private') { Write-Host ('    [PASS] Interface ''' + $prof.InterfaceAlias + ''' is set to Private network (Trust enabled).' ) -ForegroundColor Green } else { Write-Host ('    [WARN] Interface ''' + $prof.InterfaceAlias + ''' is set to ' + $prof.NetworkCategory + '. Windows may block mobile devices. Run setup-firewall-as-admin.bat to fix.') -ForegroundColor Yellow } }"

echo.
echo [*] Checking Windows Defender Firewall Rules for Port 3000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$r = Get-NetFirewallRule -DisplayName '*Port 3000*' -ErrorAction SilentlyContinue; if ($r) { Write-Host '    [PASS] Firewall rule found for Port 3000 (Action: Allow)' -ForegroundColor Green } else { Write-Host '    [WARN] No dedicated Firewall rule found for Port 3000! Run setup-firewall-as-admin.bat' -ForegroundColor Yellow }"

echo.
echo [*] Testing HTTP Response from Host Server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $res = Invoke-WebRequest -Uri 'http://localhost:3000/api/host-info' -UseBasicParsing -TimeoutSec 3; Write-Host ('    [PASS] HTTP Server responded successfully: Status ' + $res.StatusCode) -ForegroundColor Green } catch { Write-Host ('    [FAIL] Could not reach HTTP server: ' + $_.Exception.Message) -ForegroundColor Red }"

:: Detect Primary LAN IP
for /f "tokens=*" %%a in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "([System.Net.Dns]::GetHostAddresses([System.Environment]::MachineName) | Where-Object AddressFamily -eq 'InterNetwork' | Select-Object -ExpandProperty IPAddressToString -First 1)"') do set HOST_IP=%%a

if "%HOST_IP%"=="" set HOST_IP=127.0.0.1

echo.
echo =========================================================================
echo                          CONNECTION SUMMARY                              
echo =========================================================================
echo.
echo   Host PC IP Address:          %HOST_IP%
echo   Local PC Access URL:         http://localhost:3000
echo   Mobile Phone Access URL:     http://%HOST_IP%:3000
echo.
echo   -----------------------------------------------------------------------
echo   STEP-BY-STEP MOBILE CONNECTION CHECKLIST:
echo   -----------------------------------------------------------------------
echo   1. Verify your mobile phone is connected to the SAME Wi-Fi network.
echo   2. Turn OFF Mobile Data (Cellular 4G/5G) on your phone.
echo   3. Open Chrome or Safari and type EXACTLY:
echo.
echo          http://%HOST_IP%:3000
echo.
echo      (Be sure to include 'http://' and do NOT use 'https://')
echo   4. If it times out or says 'site can't be reached':
echo      -> Right-click 'setup-firewall-as-admin.bat' and select
echo         'Run as administrator' to unlock the network and port.
echo      -> Check your router settings for 'AP Isolation' or 'Client Isolation'.
echo =========================================================================
echo.
pause
