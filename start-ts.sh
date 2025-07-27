#!/bin/bash
# FaceMatch TypeScript + OpenAPI 啟動腳本

echo "=========================================="
echo "FaceMatch 企業級管理系統 - TypeScript 版本"
echo "=========================================="
echo ""

echo "🔨 編譯 TypeScript..."
npm run build:backend

echo ""
echo "🚀 使用 PM2 啟動所有服務..."
pm2 start ecosystem.config.js

echo ""
echo "📊 服務狀態:"
pm2 status

echo ""
echo "==========================================="
echo "🎉 FaceMatch TypeScript 系統啟動完成！"
echo ""
echo "🌐 前端地址: http://localhost:3002"
echo "🔧 Legacy API: http://localhost:5001"
echo "🔧 TypeScript API: http://localhost:5002"
echo "📖 API 文檔: http://localhost:5002/api-docs"
echo "🔍 健康檢查: http://localhost:5002/health"
echo "💾 資料庫: SQLite (facematch.sqlite)"
echo ""
echo "👤 登入帳號:"
echo "Username: admin, Password: admin123"
echo "Username: safety, Password: safety123"
echo "Username: manager, Password: manager123"
echo ""
echo "✨ TypeScript + OpenAPI 特色:"
echo "- 🛡️ 型別安全的後端 API"
echo "- 📚 互動式 Swagger UI 文檔"
echo "- 🔄 完整的 OpenAPI 3.0 規範"
echo "- ⚡ 企業級開發體驗"
echo ""
echo "🔧 PM2 管理命令:"
echo "pm2 status           # 查看服務狀態"
echo "pm2 logs             # 查看日誌"
echo "pm2 restart all      # 重啟所有服務"
echo "pm2 stop all         # 停止所有服務"
echo "==========================================="