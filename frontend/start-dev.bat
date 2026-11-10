@echo off
echo Starting Vite dev server...
echo.
echo Make sure you're in the frontend directory!
echo.
cd /d "%~dp0"
call npm run dev
pause

