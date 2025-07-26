# FaceMatch 企業級管理系統

一個功能完整的企業級 FaceMatch 承攬商管理系統，整合 AD 驗證、多層級簽核工作流程、使用者管理等企業功能。

## 🚀 快速啟動

```bash
# Windows 一鍵啟動
./start.bat

# 或手動啟動
node server.js               # 後端 (Port 5001)
node static-server.js        # 前端 (Port 3002)
```

## 🌐 系統地址

- **前端**: http://localhost:3002
- **後端 API**: http://localhost:5001  
- **管理員登入**: `admin` / `admin123`
- **測試帳號**: `safety` / `safety123` (職環安), `manager` / `manager123` (再生經理)

## ✨ 核心功能

### 1. 👥 承攬商管理
- ✅ 新增、查看、編輯、刪除承攬商
- ✅ 狀態管理 (啟用/停用)
- ✅ 承攬商資料完整性驗證

### 2. 📋 施工單管理 + 簽核工作流程
- ✅ 建立、查看、編輯、刪除施工單
- ✅ **多層級簽核流程** (職環安 → 再生經理)
- ✅ **快速簽核功能** (一鍵核准/駁回/退回)
- ✅ 簽核歷史追蹤
- ✅ 狀態變更請求流程
- ✅ 承攬商關聯管理

### 3. 🎓 年度資格管理 + 快速操作
- ✅ 建立、查看、編輯、刪除資格記錄
- ✅ **快速續約功能** (可設定續約年數)
- ✅ **快速停用/重新啟用功能**
- ✅ 狀態智能管理 (有效/即將到期/已過期/已停用)
- ✅ 資格類型分類 (安全/技術/管理)
- ✅ 操作歷史追蹤 (續約人員、停用原因等)

### 4. 👤 FaceMatch 整合管理
- ✅ 新增、查看、編輯、刪除整合記錄
- ✅ 同步狀態追蹤 (待同步/同步成功/同步失敗)
- ✅ 施工單關聯管理

### 5. 🔐 企業級驗證系統
- ✅ **AD (Active Directory) 網域登入支援**
- ✅ 本地帳號驗證 (bcrypt 密碼雜湊)
- ✅ 雙重驗證模式切換
- ✅ 登入狀態管理

### 6. 👥 使用者管理系統
- ✅ **完整使用者 CRUD 操作**
- ✅ 角色管理 (管理員/職環安/再生經理/一般使用者)
- ✅ **簽核權限分配** (多層級簽核權限)
- ✅ 使用者狀態管理 (啟用/停用)
- ✅ 密碼重設功能
- ✅ AD 使用者同步
- ✅ 員工資訊完整管理

### 7. ✅ 待簽核清單
- ✅ 個人化待簽核項目
- ✅ 快速簽核操作
- ✅ 簽核進度顯示
- ✅ 權限控制 (基於角色)

## 🛠️ 技術架構

### 前端
- **純 HTML/CSS/JavaScript** - 輕量化前端
- **響應式設計** - 適配各種螢幕尺寸
- **模組化設計** - 易於維護和擴展
- **React 版本** (client/) - 未來開發備用

### 後端
- **Node.js + Express** - 高效能後端框架
- **SQLite** - 輕量級關係型資料庫
- **Sequelize ORM** - 資料庫操作抽象層
- **bcrypt** - 密碼安全雜湊
- **LDAP 支援** - AD 網域驗證整合
- **CORS** - 跨域請求支援

### 企業功能
- **多層級簽核工作流程**
- **角色基礎存取控制 (RBAC)**
- **Active Directory 整合**
- **完整操作日誌追蹤**
- **資料完整性保護**

## 📁 專案結構

```
FaceMatch/
├── server.js                  # 主要後端服務 (企業級功能)
├── static-server.js           # 靜態檔案服務
├── start.bat                  # Windows 啟動腳本
├── static/
│   └── index.html             # 主要前端應用
├── src/                       # TypeScript 後端架構 (未來開發)
│   ├── controllers/           # 控制器層
│   ├── models/               # 資料模型層
│   ├── routes/               # 路由層  
│   ├── services/             # 業務邏輯層
│   └── middleware/           # 中間件
├── client/                   # React 前端 (未來開發)
│   └── src/                  # React 元件
├── tests/                    # 測試檔案
├── legacy/                   # 舊版本檔案
├── docs/                     # 文檔檔案
├── facematch.sqlite          # SQLite 資料庫
└── README.md                 # 說明文件
```

## 🧪 API 端點

### 認證系統
- `POST /api/login` - 使用者登入 (支援 AD/本地)
- `GET /api/ad-config` - AD 設定狀態

### 承攬商管理
- `GET /api/contractors` - 取得承攬商列表
- `POST /api/contractors` - 建立承攬商
- `PUT /api/contractors/:id` - 更新承攬商
- `DELETE /api/contractors/:id` - 刪除承攬商

### 施工單 + 簽核管理
- `GET /api/work-orders` - 取得施工單列表
- `POST /api/work-orders` - 建立施工單
- `PUT /api/work-orders/:id` - 更新施工單
- `DELETE /api/work-orders/:id` - 刪除施工單
- `GET /api/work-orders/pending-approval` - 待簽核清單
- `POST /api/work-orders/:id/quick-approve` - 快速簽核
- `GET /api/work-orders/:id/history` - 簽核歷史
- `POST /api/work-orders/:id/request-status-change` - 狀態變更請求

### 年度資格 + 快速操作
- `GET /api/qualifications` - 取得資格列表
- `POST /api/qualifications` - 建立資格
- `PUT /api/qualifications/:id` - 更新資格
- `DELETE /api/qualifications/:id` - 刪除資格
- `POST /api/qualifications/:id/quick-renew` - **快速續約**
- `POST /api/qualifications/:id/quick-suspend` - **快速停用**
- `POST /api/qualifications/:id/reactivate` - **重新啟用**

### 使用者管理
- `GET /api/users` - 取得使用者列表
- `POST /api/users` - 建立使用者
- `PUT /api/users/:id` - 更新使用者
- `DELETE /api/users/:id` - 刪除使用者
- `POST /api/users/:id/reset-password` - 重設密碼
- `POST /api/users/:id/toggle-status` - 切換使用者狀態
- `POST /api/users/sync-ad` - 同步 AD 使用者
- `GET /api/approvers` - 取得簽核者清單

### FaceMatch 整合
- `GET /api/facematch` - 取得整合記錄
- `POST /api/facematch` - 建立記錄
- `PUT /api/facematch/:id` - 更新記錄
- `DELETE /api/facematch/:id` - 刪除記錄

## 🎯 使用說明

### 基本操作
1. 執行 `start.bat` 啟動系統
2. 開啟瀏覽器訪問 http://localhost:3002
3. 選擇登入方式 (AD 網域 / 本地帳號)
4. 使用測試帳號登入或聯絡管理員建立帳號
5. 根據角色權限使用相應功能

### 簽核工作流程
1. **提交施工單** - 自動進入待簽核狀態
2. **職環安簽核** - 第一層簽核 (核准/駁回/退回)
3. **再生經理簽核** - 第二層簽核 (最終決定)
4. **狀態更新** - 根據簽核結果更新施工單狀態

### 年度資格管理
1. **新增資格** - 建立年度資格記錄
2. **快速續約** - 一鍵延長資格有效期
3. **快速停用** - 緊急停用資格 (附原因)
4. **重新啟用** - 恢復已停用資格

### 使用者管理
1. **建立使用者** - 設定角色和簽核權限
2. **權限分配** - 指定簽核層級
3. **狀態管理** - 啟用/停用使用者帳號
4. **AD 同步** - 同步網域使用者資料

## 🔒 企業級安全特性

- 🛡️ **密碼安全雜湊** - bcrypt 加密儲存
- 🔐 **Active Directory 整合** - 企業網域單一登入
- 👥 **角色基礎存取控制** - 細粒度權限管理
- 📊 **操作日誌追蹤** - 完整稽核軌跡
- 🔒 **帳號狀態控制** - 即時啟用/停用
- ⚡ **工作流程控制** - 多層級簽核保護

## 📈 系統統計

- **4大核心模組** - 承攬商、施工單、年度資格、FaceMatch
- **2層簽核流程** - 職環安 → 再生經理
- **4種使用者角色** - 管理員、職環安、再生經理、一般使用者  
- **雙重驗證模式** - AD 網域 + 本地帳號
- **SQLite 資料庫** - 輕量級企業資料儲存
- **完整 CRUD 操作** - 所有模組支援增查改刪

## 📝 版本歷史

### v2.0.0 - 企業級功能 (最新)
- ✅ AD (Active Directory) 網域驗證整合
- ✅ 完整使用者管理系統 (CRUD + 權限)
- ✅ 多層級簽核工作流程 (職環安 → 再生經理)
- ✅ 年度資格快速續約/停用功能
- ✅ 快速簽核操作 (一鍵核准/駁回)
- ✅ SQLite 資料庫持久化
- ✅ 企業級安全功能 (密碼雜湊、權限控制)
- ✅ 操作歷史追蹤
- ✅ 檔案結構最佳化

### v1.0.0 - 基礎功能
- ✅ 四大核心模組基本 CRUD
- ✅ 簡單登入驗證
- ✅ 記憶體資料存儲

## 🧪 測試功能

系統包含完整的測試套件：

```bash
# 執行特定功能測試
node tests/test-user-management.js          # 使用者管理測試
node tests/test-qualification-actions.js    # 年度資格操作測試  
node tests/test-enhanced-features.js        # 企業功能測試
```

## 🚀 未來開發

- **TypeScript 後端** (src/) - 型別安全的企業級架構
- **React 前端** (client/) - 現代化使用者介面
- **MongoDB 支援** - 大型資料庫整合選項
- **微服務架構** - 容器化部署
- **API 文檔** - Swagger/OpenAPI 整合

---

## 🎉 立即開始使用！

這是一個功能完整的企業級管理系統，包含現代化的簽核工作流程、使用者管理、Active Directory 整合等企業必需功能。

**適用場景**: 承攬商管理、施工單簽核、年度資格管理、企業使用者管理

**技術特色**: 企業級安全、多層級簽核、Active Directory 整合、快速操作功能

**立即啟動**: `./start.bat` 🚀