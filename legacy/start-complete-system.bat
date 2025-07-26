@echo off
title FaceMatch Complete System - Ready for Testing
cls

echo ==========================================
echo FaceMatch Complete System
echo ==========================================
echo.

echo ✅ New Features Implemented:
echo - 🔐 Authentication System  
echo - 👥 Contractor Management (Full CRUD)
echo - 📋 Work Order Management (Full CRUD)
echo - 🎓 Annual Qualification Management
echo - 👤 FaceMatch Integration
echo - 🗄️ Complete Test Data
echo.

echo Step 1: Starting Backend (Port 5000)...
start "Backend API" cmd /k "cd /d %~dp0 && node simple-server.js"

echo Waiting for backend initialization...
timeout /t 5 /nobreak >nul

echo Step 2: Testing Backend APIs...
node test-crud.js

echo.
echo Step 3: Starting Frontend (React Dev Server)...
start "Frontend" cmd /k "cd /d %~dp0\client && npm start"

echo.
echo ==========================================
echo 🎉 COMPLETE SYSTEM READY FOR TESTING!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:5000  
echo.
echo 👤 Login Credentials:
echo Username: admin
echo Password: admin123
echo.
echo 🧪 Available Features for Testing:
echo.
echo 👥 Contractors:
echo   ✅ Create/Read/Update/Delete contractors
echo   ✅ Search and filter contractors
echo   ✅ Status management
echo.
echo 📋 Work Orders:
echo   ✅ Create/Read/Update/Delete work orders
echo   ✅ Assign contractors
echo   ✅ Safety requirements management
echo   ✅ Risk level settings
echo.
echo 🎓 Annual Qualifications:
echo   ✅ Qualification management
echo   ✅ Renewal tracking
echo   ✅ Batch checking
echo   ✅ Expiration alerts
echo.
echo 👤 FaceMatch Integration:
echo   ✅ Photo upload/management
echo   ✅ Sync with FaceMatch system
echo   ✅ Photo comparison
echo   ✅ Batch operations
echo   ✅ Status monitoring
echo.
echo ==========================================
echo.
pause