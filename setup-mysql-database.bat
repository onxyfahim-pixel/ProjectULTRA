@echo off
title Garments QMS ERP - MySQL Database Setup Tool
color 0B
cls
echo =========================================================================
echo       VALIANT GARMENTS QMS ERP - MYSQL DATABASE INITIALIZATION TOOL      
echo =========================================================================
echo.
echo This tool will:
echo   1. Verify your MySQL Server connection.
echo   2. Create the 'garments_erp' database if not already created.
echo   3. Create all relational tables (inventory, inspections, orders, audit).
echo   4. Persist all 28 Garments QMS module datasets into MySQL module_store.
echo.
echo =========================================================================
echo.

:: Check if .env.local exists
if not exist ".env.local" (
    echo [*] .env.local not found. Creating default configuration with DATABASE_URL...
    echo # Local Environment Configuration > .env.local
    echo GEMINI_API_KEY="" >> .env.local
    echo APP_URL="http://localhost:3000" >> .env.local
    echo JWT_SECRET="garments-erp-jwt-secret-key-change-in-production" >> .env.local
    echo PORT=3000 >> .env.local
    echo. >> .env.local
    echo # MySQL Host Connection Settings >> .env.local
    echo DATABASE_URL="mysql://root:password@localhost:3306/garments_erp" >> .env.local
    echo MYSQL_HOST="localhost" >> .env.local
    echo MYSQL_PORT="3306" >> .env.local
    echo MYSQL_USER="root" >> .env.local
    echo MYSQL_PASSWORD="password" >> .env.local
    echo MYSQL_DATABASE="garments_erp" >> .env.local
    echo [OK] Default .env.local created. Please edit MYSQL_PASSWORD if needed.
    echo.
)

echo Starting data migration and table creation into MySQL...
echo.

call npm.cmd run db:migrate-mysql

if %errorlevel% equ 0 (
    echo.
    echo =========================================================================
    echo [SUCCESS] MySQL Database and all ERP modules initialized on Host PC!
    echo =========================================================================
    echo You can now launch the host server by running: start-erp-host.bat
    echo.
) else (
    echo.
    echo =========================================================================
    echo [!] Setup encountered an error connecting to MySQL.
    echo =========================================================================
    echo Common reasons:
    echo  1. MySQL Server is not running. (Start MySQL from Windows Services or XAMPP)
    echo  2. MySQL root password in .env.local is incorrect.
    echo     Please open .env.local and update DATABASE_URL with your MySQL password.
    echo.
)

pause
