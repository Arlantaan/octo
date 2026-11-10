@echo off
echo Fixing node_modules issues...
cd /d "%~dp0"

echo Deleting node_modules...
if exist node_modules (
    rmdir /s /q node_modules
)

echo Deleting package-lock.json...
if exist package-lock.json (
    del package-lock.json
)

echo Installing fresh dependencies...
call npm install

echo Starting dev server...
call npm run dev

pause

