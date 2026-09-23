@echo off
setlocal enabledelayedexpansion
title Garments QMS ERP - GitHub Backup Tool
color 0B

:: Ensure current working directory is this script's directory
cd /d "%~dp0"

:: Ensure Git is in PATH
if exist "%LOCALAPPDATA%\Programs\Git\cmd" (
    set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;!PATH!"
)
if exist "%ProgramFiles%\Git\cmd" (
    set "PATH=%ProgramFiles%\Git\cmd;!PATH!"
)
if exist "%ProgramFiles(x86)%\Git\cmd" (
    set "PATH=%ProgramFiles(x86)%\Git\cmd;!PATH!"
)

cls
echo ======================================================================
echo           GARMENTS QMS ERP - ONE-CLICK GITHUB BACKUP
echo ======================================================================
echo.

:: 1. Verify Git availability
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERROR] Git could not be located on your machine.
    echo Expected location: %LOCALAPPDATA%\Programs\Git\cmd\git.exe
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('git --version') do echo [STATUS] %%v
echo.

:: 2. Ensure Git identity is set
set "GIT_USER="
set "GIT_EMAIL="
for /f "tokens=*" %%u in ('git config user.name 2^>nul') do set "GIT_USER=%%u"
for /f "tokens=*" %%e in ('git config user.email 2^>nul') do set "GIT_EMAIL=%%e"

if "!GIT_USER!"=="" (
    set /p "GIT_USER=Enter your Name or GitHub Username [Alia]: "
    if "!GIT_USER!"=="" set "GIT_USER=Alia"
    git config --global user.name "!GIT_USER!"
)
if "!GIT_EMAIL!"=="" (
    set /p "GIT_EMAIL=Enter your Email [alia@project.local]: "
    if "!GIT_EMAIL!"=="" set "GIT_EMAIL=alia@project.local"
    git config --global user.email "!GIT_EMAIL!"
)

:: 3. Initialize repository if not already initialized
if not exist ".git" (
    echo [STEP 1/5] Initializing local Git repository...
    git init -b main
    echo [OK] Initialized repository.
) else (
    echo [STEP 1/5] Repository ready on branch main.
    git branch -M main >nul 2>&1
)
echo.

:: 4. Verify or Set Remote Origin URL
set "REMOTE_URL="
for /f "tokens=*" %%r in ('git remote get-url origin 2^>nul') do set "REMOTE_URL=%%r"

if "%~1" NEQ "" (
    set "REMOTE_URL=%~1"
    git remote remove origin >nul 2>&1
    git remote add origin "!REMOTE_URL!"
    echo [OK] Remote origin updated from argument: !REMOTE_URL!
    goto :proceed_commit
)

if not "!REMOTE_URL!"=="" goto :remote_found

:prompt_remote
echo [STEP 2/5] GitHub Remote Repository setup:
echo ----------------------------------------------------------------------
echo No GitHub repository is linked to this project yet.
echo.
echo 1. Go to https://github.com/new in your browser.
echo 2. Create a new repository - for example: garments-qms-erp
echo 3. Copy the HTTPS URL - example: https://github.com/USER/garments-qms-erp.git
echo ----------------------------------------------------------------------
echo.
set /p "REMOTE_URL=Paste your GitHub Repository URL: "

if "!REMOTE_URL!"=="" (
    color 0C
    echo.
    echo [ABORTED] No repository URL provided.
    echo.
    pause
    exit /b 1
)

git remote add origin "!REMOTE_URL!"
echo [OK] Remote origin linked to: !REMOTE_URL!
goto :proceed_commit

:remote_found
echo [STEP 2/5] Linked Remote: !REMOTE_URL!

:proceed_commit
echo.

:: 5. Commit message
echo [STEP 3/5] Commit details:
set "DEFAULT_MSG=Backup %DATE% %TIME%"
echo Press ENTER to use default: [!DEFAULT_MSG!]
set /p "USER_MSG=Or type custom message: "
if "!USER_MSG!"=="" set "USER_MSG=!DEFAULT_MSG!"
echo.

:: 6. Stage files
echo [STEP 4/5] Staging files...
git add .
echo [OK] Files staged.
echo.

:: 7. Commit changes
git commit -m "!USER_MSG!" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] New changes committed: "!USER_MSG!"
) else (
    echo [INFO] Working directory clean. Ready to push existing commits.
)
echo.

:: 8. Push to GitHub
echo [STEP 5/5] Pushing to GitHub origin main...
echo ----------------------------------------------------------------------
git push -u origin main
if %ERRORLEVEL% EQU 0 goto :push_success

echo.
echo [SYNC] Push rejected - remote repository may have existing commits.
echo Attempting to fetch and rebase with remote...
git pull origin main --rebase
if %ERRORLEVEL% EQU 0 (
    echo [RETRY] Pushing again after rebase...
    git push -u origin main
    if !ERRORLEVEL! EQU 0 goto :push_success
)

echo.
echo ----------------------------------------------------------------------
echo If your GitHub repo was created with an empty README and you want to
echo overwrite it with this local project, you can force push.
echo ----------------------------------------------------------------------
set /p "FORCE_CHOICE=Do you want to force push to overwrite remote? (Y/N): "
if /i "!FORCE_CHOICE!"=="Y" (
    git push -u origin main --force
    if !ERRORLEVEL! EQU 0 goto :push_success
)

:push_failure
color 0C
echo.
echo ======================================================================
echo           [ATTENTION] Upload could not be completed.
echo ======================================================================
echo If GitHub requested credentials, please authenticate in the popup.
echo Verify your repo URL and repository write permissions.
echo.
pause
exit /b 1

:push_success
color 0A
echo.
echo ======================================================================
echo           [SUCCESS] PROJECT BACKUP COMPLETED TO GITHUB!
echo ======================================================================
echo Repository: !REMOTE_URL!
echo Time: %DATE% %TIME%
echo.
pause
exit /b 0
