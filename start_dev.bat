@echo off
title Multimedia Web Application - Dev Server
cd /d "%~dp0"
echo ===================================================
echo   Multimedia Web Application - Starting Server...
echo ===================================================
echo.
echo 1. Checking dependencies...
if not exist node_modules (
  echo Node modules not found. Running npm install...
  call npm install
)

echo.
echo 2. Starting Vite Dev Server on http://localhost:5173
echo.
start http://localhost:5173
call npm run dev
pause
