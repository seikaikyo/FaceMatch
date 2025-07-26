# FaceMatch 承攬商管理系統 - 前端

這是承攬商施工申請單與 FaceMatch 人臉辨識系統整合平台的前端應用。

## 功能特色

- 🏢 **承攬商管理** - 承攬商基本資料與合約管理
- 📋 **施工單管理** - 施工申請單建立、編輯與狀態追蹤
- ✅ **年度資格管理** - 人員資格認證與到期提醒
- 🔄 **FaceMatch 整合** - 自動同步人員權限到人臉辨識系統
- 📊 **狀態監控** - 即時同步狀態與錯誤追蹤

## 技術棧

- **React 18** - 現代化 UI 框架
- **TypeScript** - 型別安全開發
- **Tailwind CSS** - 實用優先的 CSS 框架
- **React Query** - 資料狀態管理
- **Zustand** - 輕量級狀態管理
- **React Hook Form** - 表單處理
- **React Router** - 路由管理

## 開發環境設定

### 前置需求

- Node.js 18 或以上版本
- npm 或 yarn 套件管理器

### 安裝步驟

1. 安裝相依套件：
   ```bash
   npm install
   ```

2. 啟動開發伺服器：
   ```bash
   npm start
   ```

3. 開啟瀏覽器訪問：
   ```
   http://localhost:3000
   ```

### 建置產品版本

```bash
npm run build
```

建置完成的檔案會在 `build/` 目錄中。

## 專案結構

```
src/
├── components/          # 元件
│   ├── ui/             # 基礎 UI 元件
│   ├── contractors/    # 承攬商相關元件
│   ├── workOrders/     # 施工單相關元件
│   └── layout/         # 版面配置元件
├── hooks/              # 自定義 Hooks
├── pages/              # 頁面元件
├── services/           # API 服務
├── store/              # 狀態管理
├── types/              # TypeScript 型別定義
└── utils/              # 工具函數
```

## 環境變數

在 `package.json` 中設定了 proxy 指向後端 API：

```json
{
  "proxy": "http://localhost:8090"
}
```

如需修改後端 API 位址，請更新此設定。

## 主要功能頁面

### 承攬商管理 (`/contractors`)
- 承攬商列表與搜尋
- 新增/編輯/刪除承攬商
- 合約狀態管理

### 施工單管理 (`/work-orders`)
- 施工單列表與篩選
- 新增/編輯施工單
- 人員指派與時段設定
- 狀態追蹤

### 年度資格管理 (`/qualifications`)
- 人員資格列表
- 資格到期提醒
- 批次資格更新

### FaceMatch 整合 (`/facematch`)
- 同步狀態監控
- 錯誤處理與重試
- 手動同步操作

## 開發注意事項

1. **型別安全**：所有 API 呼叫都有完整的 TypeScript 型別定義
2. **錯誤處理**：使用統一的錯誤處理機制
3. **權限控制**：根據使用者角色顯示不同功能
4. **響應式設計**：支援各種螢幕尺寸
5. **無障礙設計**：遵循 WCAG 無障礙標準

## API 整合

前端透過 `src/services/` 中的服務層與後端 API 整合：

- `auth.ts` - 認證相關 API
- `contractors.ts` - 承攬商管理 API
- `workOrders.ts` - 施工單管理 API
- `api.ts` - 基礎 HTTP 客戶端

所有 API 呼叫都會自動附加 JWT token，並處理認證過期的情況。

## 部署

### 開發環境
```bash
npm start
```

### 產品環境
```bash
npm run build
npm run serve  # 或使用 nginx 等靜態檔案伺服器
```

建議使用 nginx 或 Apache 等網頁伺服器來託管建置後的檔案。

## 故障排除

### 常見問題

1. **無法連接後端 API**
   - 檢查後端伺服器是否運行在 `http://localhost:8090`
   - 確認 proxy 設定正確

2. **登入失敗**
   - 檢查後端資料庫連線
   - 確認使用者帳號密碼正確

3. **頁面載入錯誤**
   - 清除瀏覽器快取
   - 檢查控制台錯誤訊息

### 開發工具

推薦使用以下瀏覽器擴充套件：

- React Developer Tools
- Redux DevTools (for Zustand)
- TypeScript Importer

## 貢獻指南

1. Fork 專案
2. 建立功能分支
3. 提交變更
4. 建立 Pull Request

## 授權

MIT License