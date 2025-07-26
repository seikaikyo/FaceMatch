@echo off
title FaceMatch 企業管理系統啟動器
cls

echo ==========================================
echo FaceMatch 企業級管理系統
echo ==========================================
echo.

echo ✅ 系統特點:
echo - 🚀 企業級 Node.js + React 架構
echo - 📝 完整四大功能模組 CRUD 操作
echo - 🔐 AD 網域驗證 + 本地帳號支援
echo - 👥 完整使用者管理系統
echo - ✅ 多層級簽核工作流程
echo - ⚡ 年度資格快速續約/停用功能
echo - 💾 SQLite 資料庫持久化
echo.

echo Step 1: 啟動後端服務 (Port 5001)...
start "FaceMatch 後端 API" cmd /k "cd /d %~dp0 && node server.js"

echo 等待後端初始化...
timeout /t 3 /nobreak >nul

echo Step 2: 啟動前端服務 (Port 3002)...
start "FaceMatch 前端" cmd /k "cd /d %~dp0 && node static-server.js"

echo.
echo ==========================================
echo 🎉 FaceMatch 企業系統啟動中！
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
echo - ✅ 簽核管理 (職環安 → 再生經理 + 快速簽核)
echo - 🔐 AD 網域驗證 (支援 Active Directory)
echo - 👤 使用者管理 (角色管理 + 權限分配)
echo - 🎓 年度資格管理 (快速續約/停用功能)
echo - 👤 FaceMatch 整合 (完整 CRUD)
echo.
echo ⚡ 所有功能都可立即測試！
echo ==========================================
echo.
pause