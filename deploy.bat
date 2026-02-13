@echo off
echo ========================================
echo   Deploy to GitHub Pages
echo ========================================
echo.

REM Check if git is initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    echo.
)

REM Get GitHub username and repo name
set /p USERNAME="Enter your GitHub username: "
set /p REPONAME="Enter repository name (default: ProcessFlowDesigner): "

if "%REPONAME%"=="" set REPONAME=ProcessFlowDesigner

echo.
echo Repository: https://github.com/%USERNAME%/%REPONAME%
echo.
echo Make sure you've created this repository on GitHub first!
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

REM Add all files
echo.
echo Adding files...
git add .

REM Commit
echo.
set /p COMMITMSG="Enter commit message (default: Update): "
if "%COMMITMSG%"=="" set COMMITMSG=Update

git commit -m "%COMMITMSG%"

REM Add remote if not exists
git remote remove origin 2>nul
git remote add origin https://github.com/%USERNAME%/%REPONAME%.git

REM Push to GitHub
echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main -f

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo Your site will be available at:
echo https://%USERNAME%.github.io/%REPONAME%/
echo.
echo Enable GitHub Pages:
echo 1. Go to https://github.com/%USERNAME%/%REPONAME%/settings/pages
echo 2. Source: Branch = main, Folder = / (root)
echo 3. Click Save
echo 4. Wait 2 minutes, then visit your site!
echo.
pause
