# FaceMatch 企業級管理系統

[![API Migration](https://img.shields.io/badge/API%20Migration-100%25%20Complete-green.svg)](./API-MIGRATION-STATUS.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](./src)
[![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-brightgreen.svg)](./src/docs/openapi.yml)

一個功能完整的企業級 FaceMatch 承攬商管理系統，具備完整的 TypeScript 後端、OpenAPI 文檔、多層級簽核工作流程、AD 驗證整合等企業功能。

## 🎉 最新消息

**🚀 API 遷移專案完成！** 所有 42 個 API 端點已成功從 JavaScript 遷移到 TypeScript，實現 100% 類型安全！

## 🚀 快速啟動

### 前置要求
- Node.js 18+ LTS
- PM2 (生產環境)
- npm 或 yarn

### 一鍵安裝與啟動
```bash
# 1. 安裝依賴
npm run setup

# 2. 建置專案
npm run build

# 3. 啟動服務 (推薦 PM2)
npm run start:pm2

# 查看服務狀態
pm2 status
```

### 開發模式
```bash
# 同時啟動前後端開發模式
npm run dev:all

# 或分別啟動
npm run dev           # 後端開發模式
npm run dev:frontend  # 前端開發模式
```

### 生產環境部署
```bash
# Rocky Linux/CentOS/RHEL 自動部署
./deploy-rocky.sh

# 手動 PM2 管理
npm run start:pm2     # 啟動服務
npm run stop:pm2      # 停止服務  
npm run restart:pm2   # 重啟服務
```

## 🌐 系統地址

### 🏠 本地開發環境
- **🎯 主系統**: http://localhost:3000 (前端)
- **🔗 API 服務**: http://localhost:5001/api
- **📖 API 文檔**: http://localhost:5001/api-docs
- **🔍 健康檢查**: http://localhost:5001/health
- **📊 管理介面**: http://localhost:5001/static

### ☁️ 雲端部署環境
- **🚀 Vercel 生產環境**: https://facematch-system-f1j3rih5s-seikaikyos-projects.vercel.app
  - 專案首頁: https://facematch-system-f1j3rih5s-seikaikyos-projects.vercel.app/
  - 系統展示: https://facematch-system-f1j3rih5s-seikaikyos-projects.vercel.app/demo
  - 完整系統: https://facematch-system-f1j3rih5s-seikaikyos-projects.vercel.app/app (前端展示，含雲端說明)
- **📊 GitHub Pages 展示**: https://seikaikyo.github.io/FaceMatch
- **🎯 本地展示服務**: `npm run demo` → http://localhost:8000

> **💡 說明**: 雲端版本為前端展示用途，完整功能需本地部署後端 API

### 預設登入帳號
- **系統管理員**: `admin` / `admin123`
- **職環安專員**: `safety` / `safety123`
- **再生經理**: `manager` / `manager123`
- **一般使用者**: `user001` / `user123`

⚠️ **安全提醒**: 生產環境請務必修改預設密碼！參考 [SECURITY.md](SECURITY.md)

## ✨ 核心功能

### 🏗️ 系統架構 (100% TypeScript)
- ✅ **完整 TypeScript 後端** - 42 個 API 端點全面類型安全
- ✅ **OpenAPI 3.0 規範** - 標準化 REST API 文檔
- ✅ **Swagger UI 整合** - 互動式 API 測試介面
- ✅ **智能前端路由** - 自動 API 版本檢測
- ✅ **統一錯誤處理** - 一致的響應格式

### 👥 承攬商管理
- ✅ 完整 CRUD 操作 (創建、讀取、更新、刪除)
- ✅ 狀態管理 (啟用/停用)
- ✅ 進階搜尋與篩選
- ✅ 資料完整性驗證

### 📋 施工單管理 + 多層級簽核
- ✅ 施工單生命週期管理
- ✅ **企業級簽核工作流程** (職環安 → 再生經理)
- ✅ **智能駁回系統** - 角色基礎駁回權限
  - 職環安：駁回至申請人
  - 經理：選擇性駁回 (申請人/上一層)
  - 管理員：全權駁回至任意層級
- ✅ 簽核歷史完整追蹤
- ✅ 待簽核清單個人化
- ✅ 狀態變更請求流程

### 🎓 年度資格管理 + 快速操作
- ✅ 資格記錄完整管理
- ✅ **快速續約功能** (彈性續約年數)
- ✅ **快速停用/重新啟用**
- ✅ 智能狀態管理 (有效/即將到期/已過期/已停用)
- ✅ 資格類型分類 (安全類/技術類)
- ✅ 續約歷史與原因追蹤

### 👤 使用者管理系統
- ✅ **完整使用者 CRUD**
- ✅ 角色權限管理 (管理員/職環安/經理/承攬商)
- ✅ **多層級簽核權限分配**
- ✅ 使用者狀態即時控制
- ✅ 密碼重設與安全管理
- ✅ AD 同步功能

### 🔍 人臉辨識管理 (NEW!)
- ✅ 人臉辨識記錄 CRUD 操作
- ✅ **人臉驗證功能** (相似度計算與閾值判斷)
- ✅ **數據同步功能** (設備與時間範圍篩選)
- ✅ 設備追蹤與地點管理
- ✅ 驗證狀態管理 (待處理/成功/失敗)

### 🔐 企業級認證系統
- ✅ **AD (Active Directory) 網域登入**
- ✅ 本地帳號驗證 (bcrypt 安全雜湊)
- ✅ 雙重驗證模式切換
- ✅ 會話管理與權限控制
- ✅ 登入狀態持久化

### 📊 企業級日誌系統
- ✅ **完整操作稽核軌跡**
- ✅ 分類搜尋與日誌分析
- ✅ 統計分析功能
- ✅ 自動日誌清理 (管理員功能)

## 🛠️ 技術架構

### 後端 (100% TypeScript)
```
技術棧:
├── TypeScript 5.8+        # 類型安全
├── Express.js 4.21+       # Web 框架
├── OpenAPI 3.0            # API 規範
├── Swagger UI             # API 文檔
├── SQLite + Sequelize     # 資料庫
├── bcrypt                 # 密碼加密
├── LDAP 整合              # AD 驗證
├── Winston                # 日誌管理
└── PM2                    # 進程管理
```

### 前端
```
技術棧:
├── 響應式 HTML/CSS/JS     # 輕量化前端
├── 智能 API 路由          # 自動後端檢測
├── 模組化設計             # 易於維護
├── React 版本 (client/)   # 現代化備選
└── 深色模式支援           # 使用者體驗
```

### 企業功能
```
核心特性:
├── 多層級簽核工作流程     # 業務流程自動化
├── 角色基礎存取控制       # RBAC 權限系統
├── Active Directory 整合   # 企業帳號統一
├── 完整操作日誌追蹤       # 稽核與合規
├── 資料完整性保護         # 商業邏輯驗證
└── API 文檔與測試         # 開發者友善
```

## 📁 專案結構

```
FaceMatch/
├── 🚀 主要服務
│   ├── ecosystem.config.js        # PM2 生產環境配置
│   ├── package.json               # 專案依賴與腳本
│   └── deploy-rocky.sh             # 自動部署腳本
├── 📂 TypeScript 後端 (src/)
│   ├── app.ts                     # 主應用程式入口
│   ├── routes/                    # API 路由層
│   │   ├── api.ts                # 主路由配置
│   │   ├── auth.ts               # 認證管理
│   │   ├── contractors.ts        # 承攬商管理
│   │   ├── work-orders.ts        # 施工單管理
│   │   ├── approvals.ts          # 簽核管理
│   │   ├── qualifications.ts     # 年度資格管理
│   │   ├── facematch.ts          # 人臉辨識管理 ⭐ NEW
│   │   ├── users.ts              # 使用者管理
│   │   ├── config.ts             # 系統配置
│   │   └── logs.ts               # 日誌管理
│   ├── models/                   # 資料模型
│   ├── middleware/               # 中間件
│   ├── types/                    # TypeScript 類型
│   ├── utils/                    # 工具函數
│   ├── config/                   # 配置檔案
│   └── docs/                     # OpenAPI 規範
│       └── openapi.yml           # API 文檔定義
├── 📂 前端
│   ├── static/index.html         # 主要前端應用
│   └── client/                   # React 版本 (開發中)
├── 📂 編譯輸出
│   └── dist/                     # TypeScript 編譯結果
├── 📂 文檔
│   ├── README.md                 # 主要說明文件
│   ├── API-MIGRATION-STATUS.md   # API 遷移狀態 ⭐
│   ├── SECURITY.md               # 安全配置指南
│   └── DEPLOY.md                 # 部署指南
└── 📂 資料與日誌
    ├── facematch.sqlite          # SQLite 資料庫
    └── logs/                     # 系統日誌
```

## 🔗 API 端點總覽

### 認證管理 (3 endpoints)
```
POST   /api/login           # 使用者登入 (AD/本地)
POST   /api/logout          # 使用者登出
GET    /api/verify-session  # 會話驗證
```

### 承攬商管理 (5 endpoints)
```
GET    /api/contractors     # 取得承攬商列表
POST   /api/contractors     # 建立承攬商
GET    /api/contractors/:id # 取得單一承攬商
PUT    /api/contractors/:id # 更新承攬商
DELETE /api/contractors/:id # 刪除承攬商
```

### 施工單 + 簽核管理 (15 endpoints)
```
# 施工單基本操作
GET    /api/work-orders                    # 取得施工單列表
POST   /api/work-orders                    # 建立施工單
GET    /api/work-orders/:id                # 取得單一施工單
PUT    /api/work-orders/:id                # 更新施工單
DELETE /api/work-orders/:id                # 刪除施工單

# 簽核流程
GET    /api/work-orders/pending-approval   # 待簽核清單
POST   /api/work-orders/:id/approve        # 快速簽核
GET    /api/work-orders/:id/history        # 簽核歷史

# 進階簽核操作
POST   /api/approvals/:id/submit           # 提交申請
POST   /api/approvals/:id/ehs              # 職環安簽核
POST   /api/approvals/:id/manager          # 經理簽核
POST   /api/approvals/:id/admin-reject     # 管理員駁回
POST   /api/approvals/:id/resubmit         # 重新提交
GET    /api/approvals/:id/history          # 詳細簽核歷史
GET    /api/approvals/pending              # 個人待簽核清單
```

### 年度資格管理 (7 endpoints)
```
GET    /api/qualifications                 # 取得資格列表
POST   /api/qualifications                 # 建立資格
GET    /api/qualifications/:id             # 取得單一資格
PUT    /api/qualifications/:id             # 更新資格
DELETE /api/qualifications/:id             # 刪除資格
POST   /api/qualifications/:id/quick-renew # 快速續約 ⚡
POST   /api/qualifications/:id/quick-suspend # 快速停用 ⚡
POST   /api/qualifications/:id/reactivate  # 重新啟用 ⚡
```

### 人臉辨識管理 (6 endpoints) ⭐ NEW
```
GET    /api/facematch                      # 取得辨識記錄列表
POST   /api/facematch                      # 建立辨識記錄
GET    /api/facematch/:id                  # 取得單一記錄
PUT    /api/facematch/:id                  # 更新記錄
DELETE /api/facematch/:id                  # 刪除記錄
POST   /api/facematch/verify               # 人臉驗證 🔍
POST   /api/facematch/sync                 # 數據同步 🔄
```

### 使用者管理 (7 endpoints)
```
GET    /api/users                          # 取得使用者列表
POST   /api/users                          # 建立使用者
GET    /api/users/:id                      # 取得單一使用者
PUT    /api/users/:id                      # 更新使用者
DELETE /api/users/:id                      # 刪除使用者
POST   /api/users/:id/reset-password       # 重設密碼
POST   /api/users/:id/toggle-status        # 切換狀態
POST   /api/users/sync-ad                  # AD 同步
```

### 系統配置與日誌 (4 endpoints)
```
GET    /api/ad-config                      # AD 配置狀態
GET    /api/approvers                      # 簽核者清單
GET    /api/logs/stats                     # 日誌統計
DELETE /api/logs/cleanup                   # 日誌清理
```

**總計: 42 個 API 端點 - 100% TypeScript 實現** ✅

## 📊 系統統計

```
🎯 核心指標:
├── API 端點總數: 42 個
├── TypeScript 覆蓋率: 100%
├── 功能模組數: 8 個主要模組
├── 簽核層級: 2 層企業流程
├── 使用者角色: 4 種權限等級
├── 認證方式: 2 種 (AD + 本地)
└── 資料庫: SQLite (輕量企業級)
```

```
🚀 技術成就:
├── ✅ 完整 API 遷移 (JS → TS)
├── ✅ OpenAPI 3.0 文檔化
├── ✅ 智能前端路由系統
├── ✅ 企業級安全實作
├── ✅ 多層級簽核工作流程
├── ✅ 完整稽核日誌系統
└── ✅ 生產環境自動部署
```

## 🔒 企業級安全特性

- 🛡️ **密碼安全**: bcrypt 雜湊 + 可調 salt rounds
- 🔐 **AD 整合**: 企業網域單一登入支援
- 👥 **RBAC 權限**: 角色基礎存取控制
- 📊 **完整稽核**: 所有操作追蹤記錄
- 🔒 **帳號控制**: 即時啟用/停用管理
- ⚡ **工作流程**: 多層級簽核保護機制
- 🔑 **配置安全**: 環境變數與代碼分離
- 🛡️ **生產防護**: 詳細安全配置指南

## 📈 版本歷史

### v3.1.0 - 多平台部署完成 🚀 (最新)
- ✅ **Vercel 生產部署** - 雲端環境自動部署與 CI/CD
- ✅ **GitHub Pages 展示** - 靜態展示頁面自動發布
- ✅ **多平台配置** - Vercel + GitHub Actions + Codespaces 完整支援
- ✅ **專案結構優化** - 移除 40+ 無用檔案，專案輕量化 70%
- ✅ **部署文檔完整化** - 完整多平台部署指南

### v3.0.0 - API 遷移完成 🎉
- ✅ **100% API 遷移完成** - 42 個端點全面 TypeScript 化
- ✅ **人臉辨識管理** - 新增完整人臉驗證與同步功能
- ✅ **統一後端架構** - 移除雙 API 系統，統一使用 TypeScript
- ✅ **OpenAPI 完整化** - 所有端點標準化文檔
- ✅ **前端路由簡化** - 移除 API 版本切換，專注單一後端
- ✅ **依賴清理** - 移除無用依賴，優化專案結構
- ✅ **PM2 優化** - 統一生產環境管理配置

### v2.3.0 - 生產環境部署升級
- 🚀 **Rocky Linux 自動部署** - 全自動 VM 部署腳本
- 🔧 **智能環境檢查** - 系統相容性自動驗證
- 📦 **一鍵軟體安裝** - Node.js + PM2 自動配置
- ⚙️ **企業級系統配置** - 防火牆、SELinux 自動設定

### v2.2.0 - TypeScript + OpenAPI 企業級升級
- ✅ **TypeScript 後端** - 型別安全企業架構
- ✅ **OpenAPI 3.0 規範** - 標準化 API 文檔
- ✅ **Swagger UI 整合** - 互動式測試介面
- ✅ **雙後端支援** - Legacy + TypeScript 並行

### v2.1.0 - 增強型簽核系統
- ✅ **智能簽核駁回** - 角色基礎駁回權限
- ✅ **企業級日誌** - 完整稽核追蹤
- ✅ **會話管理** - 安全認證系統
- ✅ **重新提交機制** - 彈性工作流程

### v2.0.0 - 企業級功能
- ✅ **AD 網域驗證** - Active Directory 整合
- ✅ **使用者管理** - 完整 CRUD + 權限系統
- ✅ **多層級簽核** - 職環安 → 經理工作流程
- ✅ **年度資格管理** - 快速續約/停用功能

## 🧪 開發與測試

### 開發腳本
```bash
npm run dev           # 後端開發模式 (nodemon)
npm run dev:frontend  # 前端開發模式
npm run dev:all       # 同時啟動前後端
npm run build         # 建置整個專案
npm run lint          # ESLint 代碼檢查
npm run format        # Prettier 代碼格式化
npm run clean         # 清理建置檔案與日誌
```

### 測試與驗證
```bash
# API 測試 (透過 Swagger UI)
curl http://localhost:5001/api-docs

# 健康檢查
curl http://localhost:5001/health

# 功能驗證
curl http://localhost:5001/api/contractors
```

## 🎯 使用案例

### 承攬商管理流程
1. **新增承攬商** → 建立基本資料與聯絡資訊
2. **資格驗證** → 檢查年度資格有效性
3. **施工申請** → 提交施工單進入簽核流程
4. **多層簽核** → 職環安 → 經理逐層核准
5. **FaceMatch 整合** → 人臉辨識驗證進場

### 年度資格管理流程
1. **建立資格** → 新增技術/安全資格記錄
2. **狀態監控** → 自動追蹤即將到期資格
3. **快速續約** → 一鍵延長有效期限
4. **緊急停用** → 違規時立即暫停資格
5. **重新啟用** → 問題解決後恢復資格

### 簽核工作流程
1. **提交申請** → 申請人建立施工單
2. **職環安審核** → 第一層安全檢查
3. **經理核准** → 最終決策層級
4. **智能駁回** → 靈活的駁回路由選擇
5. **重新提交** → 修正後重新進入流程

## 🚀 立即開始

```bash
# 1. 克隆專案
git clone <repository-url>
cd FaceMatch

# 2. 安裝與建置
npm run setup

# 3. 啟動服務
npm run start:pm2

# 4. 打開瀏覽器
open http://localhost:3000
```

## 📞 支援與貢獻

- **文檔**: 完整 API 文檔位於 `/api-docs`
- **問題回報**: 請使用 GitHub Issues
- **安全問題**: 請參考 [SECURITY.md](SECURITY.md)
- **部署指南**: 詳見 [DEPLOY.md](DEPLOY.md)

---

## 🎉 專案特色

這是一個**功能完整的企業級管理系統**，具備：

✅ **100% TypeScript 後端** - 完整類型安全  
✅ **企業級簽核工作流程** - 多層級業務流程自動化  
✅ **Active Directory 整合** - 企業帳號統一管理  
✅ **OpenAPI 3.0 標準** - 完整 API 文檔與測試  
✅ **生產環境就緒** - PM2 + 自動部署腳本  

**適用場景**: 承攬商管理、施工安全簽核、年度資格追蹤、企業使用者管理、人臉辨識整合

**立即體驗**: `npm run setup && npm run start:pm2` 🚀