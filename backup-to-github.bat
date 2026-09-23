@echo off
setlocal enabledelayedexpansion
title Garments QMS ERP - GitHub Backup Tool
color 0B

echo ======================================================================
echo           GARMENTS QMS ERP - ONE-CLICK GITHUB BACKUP
echo ======================================================================
echo.

:: 1. Locate Git executable
set "GIT_CMD=git"
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
        set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
        set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
    ) else if exist "%ProgramFiles%\Git\cmd\git.exe" (
        set "GIT_CMD=%ProgramFiles%\Git\cmd\git.exe"
        set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
    ) else if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" (
        set "GIT_CMD=%ProgramFiles(x86)%\Git\cmd\git.exe"
        set "PATH=%ProgramFiles(x86)%\Git\cmd;%PATH%"
    ) else (
        color 0C
        echo [ERROR] Git is not detected on your system.
        echo Please ensure Git is installed.
        echo.
        pause
        exit /b 1
    )
)

echo [OK] Git found: !GIT_CMD!
for /f "tokens=*" %%v in ('"!GIT_CMD!" --version') do echo [INFO] %%v
echo.

:: 2. Check Git User Configuration
for /f "tokens=*" %%u in ('"!GIT_CMD!" config user.name 2^>nul') do set "GIT_USER=%%u"
for /f "tokens=*" %%e in ('"!GIT_CMD!" config user.email 2^>nul') do set "GIT_EMAIL=%%e"

if "!GIT_USER!"=="" (
    echo [SETUP] Git user name is not configured.
    set /p "GIT_USER=Enter your Name or GitHub Username: "
    if "!GIT_USER!"=="" set "GIT_USER=User"
    "!GIT_CMD!" config --global user.name "!GIT_USER!"
)
if "!GIT_EMAIL!"=="" (
    echo [SETUP] Git user email is not configured.
    set /p "GIT_EMAIL=Enter your Email: "
    if "!GIT_EMAIL!"=="" set "GIT_EMAIL=user@example.com"
    "!GIT_CMD!" config --global user.email "!GIT_EMAIL!"
)

:: 3. Initialize Git repository if not present
if not exist ".git" (
    echo [STEP 1/5] Initializing local Git repository...
    "!GIT_CMD!" init -b main
    if %ERRORLEVEL% NEQ 0 (
        "!GIT_CMD!" init
        "!GIT_CMD!" branch -M main
    )
    echo [OK] Local repository initialized.
) else (
    echo [STEP 1/5] Local Git repository is already initialized.
    "!GIT_CMD!" branch -M main >nul 2>&1
)
echo.

:: 4. Verify or Set Remote Origin URL
set "REMOTE_URL="
for /f "tokens=*" %%r in ('"!GIT_CMD!" remote get-url origin 2^>nul') do set "REMOTE_URL=%%r"

if "!REMOTE_URL!"=="" (
    echo [STEP 2/5] GitHub Remote Repository setup:
    echo No GitHub remote is currently linked to this project.
    echo.
    echo Please paste your GitHub repository URL:
    echo (Example: https://github.com/your-username/garments-erp.git)
    set /p "REMOTE_URL=GitHub Repository URL: "
    
    if "!REMOTE_URL!"=="" (
        color 0C
        echo.
        echo [ERROR] No repository URL was provided. Backup aborted.
        echo.
        pause
        exit /b 1
    )
    "!GIT_CMD!" remote add origin "!REMOTE_URL!"
    echo [OK] Remote 'origin' linked to: !REMOTE_URL!
) else (
    echo [STEP 2/5] Remote 'origin' is linked to: !REMOTE_URL!
)
echo.

:: 5. Prompt for Commit Message
echo [STEP 3/5] Preparing commit...
set "DEFAULT_MSG=Backup %DATE% %TIME%"
echo Enter commit description (or press ENTER to use default):
set /p "USER_MSG=Commit message [!DEFAULT_MSG!]: "
if "!USER_MSG!"=="" set "USER_MSG=!DEFAULT_MSG!"
echo.

:: 6. Stage files
echo [STEP 4/5] Staging files (excluding node_modules, .next, and sensitive keys)...
"!GIT_CMD!" add .
echo [OK] Files staged.
echo.

:: 7. Commit changes
"!GIT_CMD!" commit -m "!USER_MSG!"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] No new changes to commit, or commit already up to date.
) else (
    echo [OK] Changes committed successfully.
)
echo.

:: 8. Push to GitHub
echo [STEP 5/5] Uploading to GitHub (main branch)...
echo ----------------------------------------------------------------------
"!GIT_CMD!" push -u origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] Standard push was rejected.
    echo This usually happens if the remote repository on GitHub was created with
    echo a README or existing files that are not in your local folder yet.
    echo.
    echo Attempting to synchronize remote changes (pull with rebase)...
    "!GIT_CMD!" pull origin main --rebase
    if %ERRORLEVEL% EQU 0 (
        echo [RETRY] Pushing again after rebase...
        "!GIT_CMD!" push -u origin main
    )
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ----------------------------------------------------------------------
        echo [OPTIONS] If the repository on GitHub is brand new and you want to
        echo overwrite it with your local project, you can force push.
        echo.
        set /p "DO_FORCE=Would you like to force push to GitHub? (Y/N): "
        if /i "!DO_FORCE!"=="Y" (
            "!GIT_CMD!" push -u origin main --force
        )
    )
)

echo.
if %ERRORLEVEL% EQU 0 (
    color 0A
    echo ======================================================================
    echo           [SUCCESS] PROJECT BACKUP UPLOADED TO GITHUB!
    echo ======================================================================
    echo Repository: !REMOTE_URL!
) else (
    color 0C
    echo ======================================================================
    echo           [FAILED] Push could not be completed.
    echo ======================================================================
    echo Please verify your GitHub permissions, credentials, or repository URL.
)
echo.
pause
