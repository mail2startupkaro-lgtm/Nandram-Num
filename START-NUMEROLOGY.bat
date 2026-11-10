@echo off
title Numerology SaaS - local server
cd /d "%~dp0"
echo.
echo  === Numerology SaaS : starting on http://localhost:3000 ===
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js is not installed. Install the LTS version from https://nodejs.org and run this again.
  pause
  exit /b 1
)
echo  Checking packages (installs anything new - first run takes a few minutes)...
call npm install --no-audit --no-fund
if not exist ".env.local" (
  echo  WARNING: .env.local not found - copy .env.example to .env.local and fill in your keys.
)
if exist ".env.local" (
  echo  Updating the database - adds any new tables...
  call npm run db:migrate:local
  if errorlevel 1 echo  WARNING: database update failed - check DATABASE_URL in .env.local. The site will still start.
)
start "" cmd /c "timeout /t 12 >nul & start http://localhost:3000"
call npm run dev
echo.
echo  Server stopped.
pause
