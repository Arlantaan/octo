@echo off
echo Finding process using port 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo Done!
pause

