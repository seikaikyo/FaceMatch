# FaceMatch 部署指南

## 🌐 免費部署選項

### 1. 🚀 Vercel 全棧部署 (推薦)

**優勢**: 支援 Node.js 後端、自動 HTTPS、全球 CDN

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入 Vercel
vercel login

# 部署專案
vercel --prod

# 首次部署會詢問設定，建議選項：
# - Project name: facematch-system
# - Framework: Other
# - Output directory: dist
```

**環境變數設定**:
```bash
# 在 Vercel Dashboard 設定環境變數
NODE_ENV=production
DATABASE_URL=file:./facematch.sqlite
JWT_SECRET=your-jwt-secret-here
```

**訪問地址**: `https://your-project.vercel.app`

---

### 2. 📄 GitHub Pages 靜態展示

**優勢**: 完全免費、自動部署、適合展示 UI

**設定步驟**:

1. **啟用 GitHub Pages**:
   ```
   Repository Settings → Pages → Source: GitHub Actions
   ```

2. **推送程式碼觸發部署**:
   ```bash
   git push origin main
   ```

3. **訪問地址**: `https://username.github.io/FaceMatch`

**功能限制**: 
- ❌ 無後端 API 功能
- ✅ 可展示完整 UI 界面
- ✅ 可展示 API 文檔

---

### 3. 💻 GitHub Codespaces 完整環境

**優勢**: 完整開發環境、即開即用、支援所有功能

**使用步驟**:

1. **開啟 Codespace**:
   ```
   GitHub Repository → Code → Codespaces → Create codespace
   ```

2. **自動環境設定** (已配置 .devcontainer):
   - Node.js 18 環境
   - 自動安裝依賴
   - 自動啟動服務

3. **訪問應用**:
   - 前端: `http://localhost:3000`
   - API: `http://localhost:5001`
   - 文檔: `http://localhost:5001/api-docs`

**免費額度**: 每月 60 小時

---

### 4. 🚄 Railway 後端部署

**優勢**: 專業後端託管、支援資料庫、自動部署

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入 Railway
railway login

# 初始化專案
railway init

# 部署
railway up
```

**配置檔案** (railway.json):
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

---

### 5. 🎭 Render 全棧部署

**優勢**: 免費 PostgreSQL、自動 SSL、簡單設定

**Web Service 設定**:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: Node.js

**訪問地址**: `https://your-app.onrender.com`

---

## 🎯 推薦部署策略

### 階段 1: 快速展示 (GitHub Pages)
```bash
# 立即可用的靜態展示
git push origin main
# 訪問: https://username.github.io/FaceMatch
```

### 階段 2: 完整功能 (Vercel)
```bash
# 支援後端 API 的完整部署
vercel --prod
# 訪問: https://your-project.vercel.app
```

### 階段 3: 開發測試 (Codespaces)
```bash
# 給其他開發者的完整環境
# 直接在 GitHub 開啟 Codespace
```

---

## 📋 部署檢查清單

### 部署前準備
- [ ] 確認所有環境變數已設定
- [ ] 執行 `npm run build` 確認建置成功
- [ ] 檢查 API 端點響應正常
- [ ] 確認資料庫連線設定正確

### GitHub Pages 專用
- [ ] 啟用 GitHub Actions
- [ ] 檢查 workflow 檔案路徑
- [ ] 確認 build 產出目錄正確

### Vercel 專用
- [ ] 安裝並登入 Vercel CLI
- [ ] 設定環境變數
- [ ] 確認 vercel.json 配置正確
- [ ] 測試 API 路由

### Codespaces 專用
- [ ] 檢查 .devcontainer 配置
- [ ] 確認 postCreateCommand 可執行
- [ ] 測試埠號轉發設定

---

## 🔧 故障排除

### 常見問題

**Vercel 部署失敗**:
```bash
# 檢查建置日誌
vercel logs

# 重新部署
vercel --prod --force
```

**GitHub Actions 失敗**:
```bash
# 檢查 workflow 狀態
git status
git log --oneline

# 重新觸發部署
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

**Codespace 服務未啟動**:
```bash
# 手動啟動服務
npm run build
npm run start:pm2
pm2 status
```

---

## 🎉 推薦使用順序

1. **立即展示**: GitHub Pages (5 分鐘設定)
2. **完整功能**: Vercel (15 分鐘設定)  
3. **開發測試**: Codespaces (即開即用)

每種方案都有其適用場景，可以同時使用多種部署方式來滿足不同需求！