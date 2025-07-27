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
echo 正在背景啟動後端服務...
start "" /b node server.js

echo 等待後端初始化...
timeout /t 3 /nobreak >nul

echo Step 2: 啟動前端服務 (Port 3002)...
echo 正在背景啟動前端服務...
start "" /b node static-server.js

echo.
echo 🔄 服務正在後台啟動中...
echo 💡 提示: 服務已在背景執行，關閉此視窗會停止所有服務
echo.
echo 等待服務完全啟動...
timeout /t 5 /nobreak >nul

echo 🎉 啟動完成！正在開啟瀏覽器...
start http://localhost:3002

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
echo Password: admin123 (來自 .env 檔案)
echo Username: safety
echo Password: safety123 (來自 .env 檔案)
echo Username: manager  
echo Password: manager123 (來自 .env 檔案)
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