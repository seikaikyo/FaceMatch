@echo off
title FaceMatch 極簡系統啟動器
cls

echo ==========================================
echo FaceMatch 極簡管理系統
echo ==========================================
echo.

echo ✅ 系統特點:
echo - 🚀 純 React + Node.js 極簡架構
echo - 📝 完整四大功能模組 CRUD 操作
echo - 🎨 內建 CSS 樣式，無複雜依賴
echo - ⚡ 快速啟動，無編譯錯誤
echo.

echo Step 1: 啟動 SQLite 後端服務 (Port 5001)...
start "SQLite 後端 API" cmd /k "cd /d %~dp0 && node sqlite-backend.js"

echo 等待後端初始化...
timeout /t 3 /nobreak >nul

echo Step 2: 啟動靜態前端服務 (Port 3002)...
start "靜態前端" cmd /k "cd /d %~dp0 && node static-server.js"

echo.
echo ==========================================
echo 🎉 極簡系統啟動中！
echo.
echo 🌐 前端地址: http://localhost:3002
echo 🔧 後端 API: http://localhost:5001
echo 💾 資料庫: SQLite (facematch.sqlite)
echo.
echo 👤 登入帳號:
echo Username: admin
echo Password: admin123
echo.
echo 📋 可用功能:
echo - 👥 承攬商管理 (完整 CRUD)
echo - 📋 施工單管理 (完整 CRUD + 簽核工作流程)
echo - ✅ 簽核管理 (職環安 → 再生經理)
echo - 🎓 年度資格管理 (完整 CRUD)
echo - 👤 FaceMatch 整合 (完整 CRUD)
echo.
echo ⚡ 所有功能都可立即測試！
echo ==========================================
echo.
pause