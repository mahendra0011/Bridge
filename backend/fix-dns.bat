@echo off
chcp 65001 >nul
echo ============================================
echo MongoDB DNS Fix for Windows
echo ============================================
echo.
echo Changing DNS to 8.8.8.8 (Google) - supports SRV records...
echo.

netsh interface ip set dns "Wi-Fi" static 8.8.8.8 primary
netsh interface ip add dns "Wi-Fi" 8.8.4.4 index=2

echo.
echo Flushing DNS cache...
ipconfig /flushdns

echo.
echo ============================================
echo DONE! Ab try karo:
echo   cd backend
echo   npm run seed:admin
echo ============================================
pause
