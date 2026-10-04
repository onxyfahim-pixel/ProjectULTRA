@echo off
title Garments QMS ERP - Easy MySQL Setup Tool
color 0B
cls

echo =========================================================================
echo       VALIANT GARMENTS QMS ERP - EASY MYSQL DATABASE SETUP TOOL          
echo =========================================================================
echo.
echo  This tool will automatically:
echo   [1] Connect to your MySQL Server (XAMPP, Standalone, or Docker).
echo   [2] Create the 'garments_erp' relational database if not already created.
echo   [3] Build all 10 relational tables (buyer_orders with WIP, inventory,
echo       production_records, inspection_records, audit_logs, users, module_store).
echo   [4] Migrate and persist all 28 Garments QMS module datasets into MySQL.
echo.
echo =========================================================================
echo.

:: Check if port 3306 is reachable
echo [*] Checking MySQL Server status on localhost:3306...
powershell -Command "if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1

if %errorlevel% equ 0 (
    echo [OK] MySQL Server is RUNNING on localhost:3306!
    echo.
) else (
    echo [!] MySQL is not currently running on port 3306.
    echo.
    echo Checking for common MySQL installations...
    
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [*] Detected XAMPP MySQL at C:\xampp\mysql\bin\mysqld.exe
        echo [*] Attempting to start XAMPP MySQL in the background...
        start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 >nul
    ) else (
        echo [*] Trying to start Windows MySQL service...
        net start MySQL80 >nul 2>&1
        if %errorlevel% neq 0 (
            net start mysql >nul 2>&1
        )
    )
    
    :: Re-test port
    powershell -Command "if (Test-NetConnection -ComputerName 127.0.0.1 -Port 3306 -InformationLevel Quiet -WarningAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] MySQL Server started successfully on port 3306!
        echo.
    ) else (
        echo [!] MySQL Server could not be started automatically.
        echo.
        echo Please ensure one of the following:
        echo   A) If using XAMPP: Open XAMPP Control Panel and click "Start" on MySQL.
        echo   B) If using MySQL Server: Start service in Windows Services or run "net start MySQL80".
        echo   C) If using Docker: Run "docker run -d -p 3306:3306 --name erp-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=garments_erp mysql:8.0"
        echo.
    )
)

echo =========================================================================
echo  SELECT YOUR MYSQL SETUP CONFIGURATION:
echo =========================================================================
echo.
echo  [1] 1-Click XAMPP Setup (root with no password - Standard XAMPP)
echo  [2] 1-Click Standard MySQL (root with password 'root')
echo  [3] 1-Click Standard MySQL (root with password 'password')
echo  [4] Custom MySQL Host, Port, User, and Password
echo  [5] Open In-Browser Web Setup Wizard (http://localhost:3000)
echo.
set /p CHOICE="Enter choice [1, 2, 3, 4, 5] (Default is 1): "

if "%CHOICE%"=="" set CHOICE=1
if "%CHOICE%"=="1" goto XAMPP
if "%CHOICE%"=="2" goto MYSQL_ROOT
if "%CHOICE%"=="3" goto MYSQL_PASS
if "%CHOICE%"=="4" goto CUSTOM
if "%CHOICE%"=="5" goto WEB_WIZARD

:XAMPP
echo.
echo [*] Applying XAMPP configuration (root, no password, localhost:3306)...
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=
set DB_NAME=garments_erp
set DB_URL=mysql://root:@localhost:3306/garments_erp
goto WRITE_ENV

:MYSQL_ROOT
echo.
echo [*] Applying Standard MySQL configuration (root, password: root)...
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=root
set DB_NAME=garments_erp
set DB_URL=mysql://root:root@localhost:3306/garments_erp
goto WRITE_ENV

:MYSQL_PASS
echo.
echo [*] Applying Standard MySQL configuration (root, password: password)...
set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=password
set DB_NAME=garments_erp
set DB_URL=mysql://root:password@localhost:3306/garments_erp
goto WRITE_ENV

:CUSTOM
echo.
echo -------------------------------------------------------------------------
echo ENTER CUSTOM MYSQL CONNECTION DETAILS:
echo -------------------------------------------------------------------------
set /p DB_HOST="Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Port (default: 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set /p DB_USER="User (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="Password: "

set /p DB_NAME="Database name (default: garments_erp): "
if "%DB_NAME%"=="" set DB_NAME=garments_erp

set DB_URL=mysql://%DB_USER%:%DB_PASS%@%DB_HOST%:%DB_PORT%/%DB_NAME%
goto WRITE_ENV

:WEB_WIZARD
echo.
echo [*] Launching ERP Database Setup Center in your browser...
start http://localhost:3000
echo.
echo Please navigate to: Settings -^> Database & Backup to configure MySQL visually.
pause
exit /b 0

:WRITE_ENV
echo.
echo [*] Updating .env.local configuration...
(
    echo # Local Environment Configuration
    echo GEMINI_API_KEY=""
    echo APP_URL="http://localhost:3000"
    echo JWT_SECRET="garments-erp-jwt-secret-key-change-in-production"
    echo PORT=3000
    echo.
    echo # Host PC MySQL Database Configuration
    echo DATABASE_URL="%DB_URL%"
    echo MYSQL_HOST="%DB_HOST%"
    echo MYSQL_PORT="%DB_PORT%"
    echo MYSQL_USER="%DB_USER%"
    echo MYSQL_PASSWORD="%DB_PASS%"
    echo MYSQL_DATABASE="%DB_NAME%"
) > .env.local

echo [OK] .env.local updated successfully.
echo.
echo [*] Running full MySQL schema migration and ERP data seeding...
echo.

call npm.cmd run db:migrate-mysql

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo   [SUCCESS] MYSQL DATABASE FULLY INITIALIZED FOR YOUR GARMENTS ERP!     
    echo =========================================================================
    echo.
    echo  - All 10 Relational Tables created and verified.
    echo  - All Buyer Orders with 9-Stage WIP Records persisted.
    echo  - Production Floor Records, Inspections, and 28 QMS modules synced.
    echo.
    echo  To launch the host server, run: start-erp-host.bat
    echo  Or open http://localhost:3000 in your browser!
    echo =========================================================================
    echo.
) else (
    echo.
    echo =========================================================================
    echo   [!] Migration could not complete.
    echo =========================================================================
    echo  Common troubleshooting steps:
    echo   1. Verify your MySQL Server is running (e.g. XAMPP Control Panel).
    echo   2. Verify your password is correct.
    echo   3. You can also open http://localhost:3000 -^> Settings -^> Database & Backup
    echo      to use the visual 1-Click Connection Wizard.
    echo =========================================================================
    echo.
)

pause
