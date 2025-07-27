# 🔒 安全配置指南

本專案已移除所有硬編碼的機敏資料，請按照以下步驟進行安全配置。

## 📋 環境變數設定

### 1. 複製環境變數範例檔案
```bash
cp .env.example .env
```

### 2. 修改 .env 檔案中的機敏資料

**重要：請修改以下預設值為安全的密碼**

```env
# 修改預設使用者密碼 (必須修改！)
DEFAULT_ADMIN_PASSWORD=your_secure_admin_password_here
DEFAULT_SAFETY_PASSWORD=your_secure_safety_password_here
DEFAULT_MANAGER_PASSWORD=your_secure_manager_password_here
DEFAULT_USER_PASSWORD=your_secure_user_password_here

# Session 密鑰 (必須修改！)
SESSION_SECRET=your_very_long_random_session_secret_key_here

# FaceMatch API 配置 (如需要)
FACEMATCH_HOST=your_facematch_server_ip
FACEMATCH_USERNAME=your_facematch_username
FACEMATCH_PASSWORD=your_facematch_password
```

## 🔧 密碼強度建議

- **最少 12 個字符**
- **包含大小寫字母、數字和特殊符號**
- **不要使用常見詞彙或個人資訊**
- **每個環境使用不同的密碼**

## 🛡️ 生產環境安全設定

### 環境變數
```env
NODE_ENV=production
BCRYPT_SALT_ROUNDS=14
RATE_LIMIT_MAX_REQUESTS=50
LOG_RETENTION_DAYS=30
```

### 建議的安全措施
1. **使用 HTTPS** - 確保所有通訊加密
2. **定期更新密碼** - 建議每 90 天更換一次
3. **啟用 AD 驗證** - 在企業環境中使用 Active Directory
4. **監控日誌** - 定期檢查操作日誌異常
5. **備份加密** - 確保資料備份經過加密

## ⚠️ 重要提醒

- **永遠不要將 .env 檔案提交到版本控制**
- **不要在代碼中硬編碼任何密碼或 API 金鑰**
- **定期審查操作日誌以發現異常活動**
- **在生產環境中禁用預設帳號**

## 🧪 安全測試

```bash
# 確認環境變數載入正確
node -e "require('dotenv').config(); console.log('環境變數載入成功');"

# 檢查密碼強度（應該不會顯示明文密碼）
node -e "require('dotenv').config(); console.log('Admin password length:', process.env.DEFAULT_ADMIN_PASSWORD.length);"
```

## 📞 安全事件回報

如果發現任何安全問題，請立即：
1. 停止相關服務
2. 更換相關密碼和金鑰
3. 檢查操作日誌
4. 聯絡系統管理員

---

**記住：安全是一個持續的過程，不是一次性的設定！**