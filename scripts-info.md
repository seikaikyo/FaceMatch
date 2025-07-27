# FaceMatch 系統啟動腳本說明

## 📋 可用腳本

### 🚀 **推薦使用**

#### `start-optimized.sh` ⭐
**最佳選擇 - 優化後的系統**
- 啟動 2 個服務：Legacy API + TypeScript API  
- 前端已整合到 Legacy API
- 記憶體使用：~130MB (節省 44%)
- 訪問地址：http://localhost:5001

#### `start-pm2.sh`
**完整的三服務版本**
- 啟動 3 個服務：Legacy API + TypeScript API + 獨立前端
- 記憶體使用：~230MB
- 訪問地址：http://localhost:3002

### 🔧 **開發用途**

#### `start-ts.sh`
**TypeScript 開發版**
- 啟動所有服務進行 API 遷移開發
- 包含完整的前端和後端
- 訪問地址：http://localhost:5001

#### `deploy-rocky.sh`
**Rocky Linux 部署腳本**
- 自動化部署到 Rocky Linux 虛擬機
- 包含完整環境設置

## 📊 **腳本對比**

| 腳本 | 服務數 | 記憶體 | 前端地址 | 用途 |
|------|--------|--------|----------|------|
| start-optimized.sh | 2個 | ~130MB | :5001 | ⭐ 生產推薦 |
| start-pm2.sh | 3個 | ~230MB | :3002 | 完整版本 |
| start-ts.sh | 2-3個 | ~180MB | :5001 | 開發測試 |

## 🗑️ **已廢棄**

- `static-server.js.deprecated` - 獨立前端服務器 (已整合)

## 🎯 **使用建議**

1. **日常使用**：`./start-optimized.sh`
2. **功能測試**：`./start-pm2.sh` 
3. **API 開發**：`./start-ts.sh`
4. **系統部署**：`./deploy-rocky.sh`

所有腳本都支援相同的登入帳號：
- admin / admin123
- safety / safety123  
- manager / manager123