@echo off
REM Cleanup Script - Removes unnecessary files from project root
echo ========================================
echo CLEANING UP PROJECT FOLDER
echo ========================================
echo.
echo This will delete:
echo   - Old deployment scripts (keeping deploy-clean-live.bat)
echo   - All .md documentation files (keeping README.md)
echo   - Fix/test/setup scripts
echo   - Email signature files
echo   - Old copy scripts
echo.
pause

echo.
echo Deleting old deployment scripts...
del /Q deploy-all.bat 2>nul
del /Q deploy-everything-live.bat 2>nul
del /Q deploy-with-plink.bat 2>nul
del /Q DEPLOY_NOW.bat 2>nul
del /Q deploy-frontend-now.bat 2>nul
del /Q deploy-backend-only.bat 2>nul
del /Q deploy.bat 2>nul
del /Q deploy-config.bat 2>nul
del /Q deploy-all.sh 2>nul
del /Q deploy.sh 2>nul

echo Deleting fix scripts...
del /Q fix-backend-*.bat 2>nul
del /Q fix-backend-*.ps1 2>nul
del /Q fix-backend-*.sh 2>nul
del /Q fix-backend-*.txt 2>nul
del /Q fix-live-server.bat 2>nul
del /Q quick-fix-live.bat 2>nul

echo Deleting test scripts...
del /Q test-backend-*.bat 2>nul
del /Q test-backend-*.ps1 2>nul
del /Q test-contact-form-*.ps1 2>nul

echo Deleting setup scripts...
del /Q setup.bat 2>nul
del /Q setup.sh 2>nul
del /Q setup-*.bat 2>nul
del /Q setup-*.sh 2>nul
del /Q initial-server-setup.bat 2>nul
del /Q auto-ssl-setup.bat 2>nul

echo Deleting check/status scripts...
del /Q check-backend-status.bat 2>nul
del /Q check-backend-status.sh 2>nul
del /Q check-server-status.bat 2>nul

echo Deleting run scripts...
del /Q run-backend.bat 2>nul
del /Q run-frontend.bat 2>nul

echo Deleting copy/optimize scripts...
del /Q copy-images.bat 2>nul
del /Q copy-liko.ps1 2>nul
del /Q optimize-*.bat 2>nul

echo Deleting restart scripts...
del /Q restart-backend-only.ps1 2>nul

echo Deleting view scripts...
del /Q view-contact-messages.ps1 2>nul

echo Deleting documentation files (keeping README.md)...
for %%f in (*.md) do (
    if /i not "%%f"=="README.md" (
        del /Q "%%f" 2>nul
    )
)

echo Deleting email signature files...
del /Q email-signature*.html 2>nul
del /Q email-signature*.txt 2>nul
del /Q SIGNATURE_*.txt 2>nul
del /Q COPY_PASTE_SIGNATURE.txt 2>nul

echo Deleting config/template files...
del /Q server-config.env 2>nul
del /Q env.template 2>nul
del /Q SERVER_PASSWORD.txt 2>nul

echo Deleting docker/firebase configs (if not needed)...
del /Q docker-compose.yml 2>nul
del /Q firebase.json 2>nul

echo.
echo ========================================
echo ✅ CLEANUP COMPLETE!
echo ========================================
echo.
echo Kept:
echo   ✅ deploy-clean-live.bat (your main deployment script)
echo   ✅ README.md
echo   ✅ check-backend-status.ps1
echo   ✅ server-setup.sh
echo   ✅ backend/ folder
echo   ✅ frontend/ folder
echo   ✅ public/ folder
echo.
echo All junk files deleted!
echo.
pause

