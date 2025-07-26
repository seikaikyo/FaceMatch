# FaceMatch 極簡管理系統

一個使用純 React + Node.js 實作的極簡版 FaceMatch 承攬商管理系統，專注於四大核心功能的完整 CRUD 操作。

## 🚀 快速啟動

```bash
# 一鍵啟動
./simple-start.bat

# 或手動啟動
node simple-backend.js        # 後端 (Port 5001)
cd simple-frontend && npm start  # 前端 (Port 3002)
```

## 🌐 系統地址

- **前端**: http://localhost:3002
- **後端 API**: http://localhost:5001
- **登入帳號**: `admin` / `admin123`

## ✨ 核心功能

### 1. 👥 承攬商管理
- ✅ 新增承攬商
- ✅ 查看承攬商列表
- ✅ 編輯承攬商資料
- ✅ 刪除承攬商
- ✅ 狀態管理 (啟用/停用)

### 2. 📋 施工單管理
- ✅ 建立施工單
- ✅ 查看施工單列表
- ✅ 編輯施工單
- ✅ 刪除施工單
- ✅ 承攬商關聯
- ✅ 狀態追蹤 (待審核/已核准/已完成)

### 3. 🎓 年度資格管理
- ✅ 建立資格記錄
- ✅ 查看資格列表
- ✅ 編輯資格資料
- ✅ 刪除資格
- ✅ 狀態管理 (有效/即將到期/已過期)
- ✅ 資格類型分類 (安全/技術/管理)

### 4. 👤 FaceMatch 整合管理
- ✅ 新增整合記錄
- ✅ 查看同步狀態
- ✅ 編輯同步資料
- ✅ 刪除記錄
- ✅ 狀態追蹤 (待同步/同步成功/同步失敗)

## 🛠️ 技術架構

### 前端
- **React 18** - 前端框架
- **原生 CSS** - 內建樣式，無外部依賴
- **Fetch API** - HTTP 請求
- **響應式設計** - 適配各種螢幕

### 後端
- **Node.js** - 執行環境
- **Express** - Web 框架
- **CORS** - 跨域支援
- **記憶體資料庫** - 模擬資料存儲

## 📁 專案結構

```
FaceMatch/
├── simple-backend.js          # 後端 API 服務
├── simple-start.bat           # 一鍵啟動腳本
├── simple-frontend/           # 前端 React 應用
│   ├── src/
│   │   ├── App.js            # 主應用組件
│   │   └── index.js          # 入口文件
│   ├── public/
│   │   └── index.html        # HTML 模板
│   └── package.json          # 前端依賴
└── README.md                 # 說明文件
```

## 🧪 API 端點

### 認證
- `POST /api/login` - 使用者登入

### 承攬商
- `GET /api/contractors` - 取得承攬商列表
- `POST /api/contractors` - 建立承攬商
- `PUT /api/contractors/:id` - 更新承攬商
- `DELETE /api/contractors/:id` - 刪除承攬商

### 施工單
- `GET /api/work-orders` - 取得施工單列表
- `POST /api/work-orders` - 建立施工單
- `PUT /api/work-orders/:id` - 更新施工單
- `DELETE /api/work-orders/:id` - 刪除施工單

### 年度資格
- `GET /api/qualifications` - 取得資格列表
- `POST /api/qualifications` - 建立資格
- `PUT /api/qualifications/:id` - 更新資格
- `DELETE /api/qualifications/:id` - 刪除資格

### FaceMatch 整合
- `GET /api/facematch` - 取得整合記錄
- `POST /api/facematch` - 建立記錄
- `PUT /api/facematch/:id` - 更新記錄
- `DELETE /api/facematch/:id` - 刪除記錄

## 🎯 使用說明

1. 執行 `simple-start.bat` 啟動系統
2. 開啟瀏覽器訪問 http://localhost:3002
3. 使用 `admin/admin123` 登入
4. 選擇上方導航切換功能模組
5. 點擊 "新增" 按鈕進行資料建立
6. 點擊 "編輯" 或 "刪除" 進行資料維護

## 🔒 系統特點

- ⚡ **極簡架構**: 無複雜依賴，快速啟動
- 🔧 **完整 CRUD**: 四大模組全部支援
- 🎨 **內建樣式**: 無需外部 CSS 框架
- 📱 **響應式設計**: 適配桌面與行動裝置
- 🛡️ **錯誤處理**: 完整的前後端錯誤處理
- 💾 **記憶體存儲**: 資料持久化至服務重啟

## 📝 開發日誌

- v1.0.0 - 完成極簡版四大功能模組
- 所有 CRUD 操作測試通過
- 前後端通訊正常
- UI/UX 設計簡潔實用

---

🎉 **系統已完成並可立即使用！**