@echo off
title Multimedia Studio Auto Launcher
color 0B
echo ========================================================
echo        MULTIMEDIA STUDIO - AUTO LAUNCHER (v2.5)
echo ========================================================
echo.
echo [*] Starting Multimedia Studio Application...
echo [*] Checking local environment...

cd /d "%~dp0"

REM Try to start Vite dev server, or fallback to node server.js
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Starting Vite Studio Development Server on http://localhost:5173 ...
    start "" http://localhost:5173
    call npm run dev
    if %errorlevel% neq 0 (
        echo [!] Vite encountered an issue, falling back to standalone server...
        node server.js
    )
) else (
    where node >nul 2>&1
    if %errorlevel% equ 0 (
        echo [*] Starting Standalone Node Server on http://localhost:5173 ...
        node server.js
    ) else (
        echo [*] Opening Standalone Dist Offline Application...
        start "" "%~dp0dist\index.html"
    )
)

pause
