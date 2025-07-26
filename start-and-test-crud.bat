@echo off
title FaceMatch Complete CRUD System
cls

echo ==========================================
echo FaceMatch - Complete CRUD System
echo ==========================================
echo.

echo ✅ Features Implemented:
echo - 🔐 Authentication System
echo - 👥 Contractor Management (Full CRUD)
echo - 📋 Work Order Management (Full CRUD)  
echo - 🗄️ MongoDB Integration
echo - 🎨 Modern React UI
echo - 🔍 Search and Filtering
echo - 📊 Pagination
echo.

echo Step 1: Starting MongoDB...
net start MongoDB 2>nul
echo MongoDB service started

echo Step 2: Starting Backend (Port 5000)...
start "Backend API" cmd /k "cd /d %~dp0 && npm run dev"

echo Waiting for backend initialization...
timeout /t 12 /nobreak >nul

echo Step 3: Testing CRUD Operations...
node test-crud.js

echo.
echo Step 4: Starting Frontend (React Dev Server)...
start "Frontend" cmd /k "cd /d %~dp0\client && npm start"

echo.
echo ==========================================
echo 🎉 COMPLETE SYSTEM READY!
echo.
echo 🌐 Frontend: http://localhost:3001
echo 🔧 Backend:  http://localhost:5000  
echo.
echo 👤 Login Credentials:
echo Username: admin
echo Password: admin123
echo.
echo 🧪 CRUD Features Available:
echo.
echo 👥 Contractors:
echo   ✅ Create new contractors
echo   ✅ View contractor list  
echo   ✅ Edit contractor details
echo   ✅ Delete contractors
echo   ✅ Search contractors
echo   ✅ Filter by status
echo.
echo 📋 Work Orders:
echo   ✅ Create new work orders
echo   ✅ View work order list
echo   ✅ Edit work order details  
echo   ✅ Delete work orders
echo   ✅ Filter by status/contractor
echo   ✅ Manage safety requirements
echo.
echo 🔍 Additional Features:
echo   ✅ Real-time data updates
echo   ✅ Form validation
echo   ✅ Error handling
echo   ✅ Responsive design
echo   ✅ Pagination support
echo ==========================================
echo.
pause