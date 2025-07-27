#!/bin/bash
# FaceMatch PM2 啟動腳本

echo "=========================================="
echo "FaceMatch 企業級管理系統 - PM2 版本"
echo "=========================================="
echo ""

echo "🚀 使用 PM2 啟動服務..."
pm2 start ecosystem.config.js

echo ""
echo "📊 服務狀態:"
pm2 status

echo ""
echo "==========================================="
echo "🎉 FaceMatch 企業系統啟動完成！"
echo ""
echo "🌐 前端地址: http://localhost:3002"
echo "🔧 後端 API: http://localhost:5001"
echo "💾 資料庫: SQLite (facematch.sqlite)"
echo ""
echo "👤 登入帳號:"
echo "Username: admin"
echo "Password: admin123 (來自 .env 檔案)"
echo "Username: safety" 
echo "Password: safety123 (來自 .env 檔案)"
echo "Username: manager"
echo "Password: manager123 (來自 .env 檔案)"
echo ""
echo "🔧 PM2 管理命令:"
echo "pm2 status           # 查看服務狀態"
echo "pm2 logs             # 查看日誌"
echo "pm2 restart all      # 重啟所有服務"
echo "pm2 stop all         # 停止所有服務"
echo "pm2 delete all       # 刪除所有服務"
echo "==========================================="