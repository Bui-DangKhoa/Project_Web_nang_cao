@echo off
echo ===================================
echo   VELOUR SHOP - Setup & Run Script
echo ===================================
echo.

echo [1/4] Installing Server dependencies...
cd /d "d:\Lập trình Web nâng cao\Đồ án\velour-shop\server"
npm install
echo.

echo [2/5] Installing Customer Client dependencies...
cd /d "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client-customer"
npm install
echo.

echo [3/5] Installing Admin Client dependencies...
cd /d "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client-admin"
npm install
echo.

echo [4/5] Done! Starting servers...
echo.
echo Please open THREE terminal windows and run:
echo.
echo   Terminal 1 (Backend):
echo   cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\server"
echo   npm run dev
echo.
echo   Terminal 2 (Frontend Customer):
echo   cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client-customer"
echo   npm run dev
echo.
echo   Terminal 3 (Frontend Admin):
echo   cd "d:\Lập trình Web nâng cao\Đồ án\velour-shop\client-admin"
echo   npm run dev
echo.
echo Then open:
echo   Customer: http://localhost:5173
echo   Admin:    http://localhost:5174
echo.
pause
