@echo off
echo ===================================
echo   VELOUR SHOP - Setup & Run Script
echo ===================================
echo.

echo [1/4] Installing Server dependencies...
cd /d "d:\Lập trình Web nâng cao\Đồ án\velour-shop\server"
npm install
echo.

echo [2/4] Installing Client dependencies...
cd /d "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client"
npm install
echo.

echo [3/4] Done! Starting servers...
echo.
echo Please open TWO terminal windows and run:
echo.
echo   Terminal 1 (Backend):
echo   cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\server"
echo   npm run dev
echo.
echo   Terminal 2 (Frontend):
echo   cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client"
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
