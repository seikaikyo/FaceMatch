# FaceMatch 系統 Rocky Linux 部署指南

## 🚀 快速部署 (推薦)

### 方法一：一鍵自動部署

```bash
# 1. 下載部署腳本
curl -fsSL https://raw.githubusercontent.com/your-repo/FaceMatch/main/deploy-rocky.sh -o deploy-rocky.sh
chmod +x deploy-rocky.sh

# 2. 執行完整部署 (包含環境檢查、軟體安裝、系統配置)
./deploy-rocky.sh
```

### 方法二：分步驟部署

```bash
# 1. 環境檢查
./deploy-rocky.sh check

# 2. 上傳專案檔案到伺服器
scp -r /local/path/FaceMatch/* user@server-ip:/home/user/facematch/

# 3. 登入伺服器安裝
ssh user@server-ip
cd /home/user/facematch
./deploy-rocky.sh install
```

## 📋 系統需求

### 最低硬體需求
- **CPU**: 1 核心 (推薦 2 核心)
- **記憶體**: 1GB (推薦 2GB)
- **磁碟**: 5GB 可用空間
- **網路**: 可連接網際網路

### 支援的作業系統
- ✅ Rocky Linux 8.x / 9.x
- ✅ CentOS 8+ 
- ✅ RHEL 8+ (Red Hat Enterprise Linux)
- ✅ AlmaLinux 8+

### 網路需求
- **輸入連接**: 
  - Port 3002 (前端)
  - Port 5001 (後端 JavaScript)
  - Port 5002 (後端 TypeScript + API 文檔)
- **輸出連接**: 
  - Port 80/443 (下載套件)
  - Port 22 (SSH)

## 🛠️ 手動安裝步驟

如果自動腳本無法使用，可以按照以下步驟手動安裝：

### 1. 系統準備

```bash
# 更新系統
sudo dnf update -y

# 安裝基礎工具
sudo dnf groupinstall -y "Development Tools"
sudo dnf install -y curl wget git unzip bc
```

### 2. 安裝 Node.js 20 LTS

```bash
# 安裝 Node.js 官方倉庫
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# 安裝 Node.js
sudo dnf install -y nodejs

# 驗證安裝
node --version  # 應該顯示 v20.x.x
npm --version
```

### 3. 安裝 PM2

```bash
# 全域安裝 PM2
sudo npm install -g pm2

# 設定開機啟動
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 4. 準備專案

```bash
# 創建專案目錄
mkdir -p ~/facematch
cd ~/facematch

# 上傳專案檔案 (從本地機器執行)
scp -r /path/to/FaceMatch/* user@server-ip:~/facematch/

# 或使用 rsync (更快)
rsync -avz --progress /path/to/FaceMatch/ user@server-ip:~/facematch/
```

### 5. 安裝依賴

```bash
cd ~/facematch

# 安裝 Node.js 依賴
npm install

# 設定環境變數
cp .env.example .env
nano .env  # 修改密碼和配置
```

### 6. 建置專案

```bash
# 編譯 TypeScript
npm run build:backend

# 或手動編譯
npx tsc
mkdir -p dist/docs
cp src/docs/*.yml dist/docs/
```

### 7. 啟動服務

```bash
# 使用 PM2 啟動
./start-pm2.sh

# 或手動啟動
pm2 start ecosystem.config.js
pm2 save
```

### 8. 設定防火牆

```bash
# 開放必要端口
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --permanent --add-port=5001/tcp
sudo firewall-cmd --permanent --add-port=5002/tcp
sudo firewall-cmd --reload
```

## 🔧 配置說明

### 環境變數配置 (.env)

```bash
# 資料庫設定
DB_TYPE=sqlite
DB_PATH=facematch.sqlite

# 預設管理員密碼 (⚠️ 必須修改)
DEFAULT_ADMIN_PASSWORD=your-secure-password-here
DEFAULT_SAFETY_PASSWORD=your-secure-password-here  
DEFAULT_MANAGER_PASSWORD=your-secure-password-here

# 密碼加密強度
BCRYPT_SALT_ROUNDS=12

# 服務端口
PORT=5001
FRONTEND_PORT=3002
TYPESCRIPT_PORT=5002

# AD 設定 (可選)
AD_ENABLED=false
AD_URL=ldap://your-ad-server
AD_BASE_DN=dc=company,dc=com
```

### PM2 配置 (ecosystem.config.js)

系統會自動使用專案中的 PM2 配置檔案，支援：
- 前端服務 (Port 3002)
- 後端 JavaScript (Port 5001)  
- 後端 TypeScript (Port 5002)

## 🚨 故障排除

### 常見問題

#### 1. Node.js 版本過舊
```bash
# 移除舊版本
sudo dnf remove -y nodejs npm

# 重新安裝最新版本
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
```

#### 2. PM2 權限問題
```bash
# 修復 PM2 權限
sudo chown -R $USER:$USER ~/.pm2
pm2 kill
pm2 start ecosystem.config.js
```

#### 3. 端口被佔用
```bash
# 檢查端口占用
sudo netstat -tlnp | grep :3002
sudo netstat -tlnp | grep :5001

# 停止佔用端口的進程
sudo kill -9 <PID>
```

#### 4. 防火牆問題
```bash
# 檢查防火牆狀態
sudo firewall-cmd --list-all

# 暫時關閉防火牆測試
sudo systemctl stop firewalld

# 重新開啟並配置
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload
```

#### 5. SELinux 問題
```bash
# 檢查 SELinux 狀態
getenforce

# 如果是 Enforcing，暫時設為 Permissive
sudo setenforce 0

# 永久關閉 (不推薦在生產環境)
sudo sed -i 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
```

#### 6. 記憶體不足
```bash
# 檢查記憶體使用
free -h
top

# 創建 swap 檔案 (如果需要)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 日誌檢查

```bash
# PM2 日誌
pm2 logs

# 系統日誌
sudo journalctl -u pm2-$USER -f

# 檢查特定服務
pm2 logs facematch-frontend
pm2 logs facematch-backend
pm2 logs facematch-backend-ts
```

## 🔒 安全設定

### 1. 修改預設密碼
```bash
# 編輯環境變數
nano .env

# 重啟服務
pm2 restart all
```

### 2. 設定 HTTPS (推薦)
```bash
# 安裝 Nginx
sudo dnf install -y nginx

# 配置反向代理
sudo nano /etc/nginx/conf.d/facematch.conf
```

範例 Nginx 配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 定期備份
```bash
# 創建備份腳本
cat > ~/backup-facematch.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp ~/facematch/facematch.sqlite $BACKUP_DIR/facematch_$DATE.sqlite
tar -czf $BACKUP_DIR/facematch_full_$DATE.tar.gz ~/facematch/

# 保留最近 7 天的備份
find $BACKUP_DIR -name "facematch_*" -mtime +7 -delete
EOF

chmod +x ~/backup-facematch.sh

# 設定定時備份 (每天凌晨 2 點)
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-facematch.sh") | crontab -
```

## 📞 技術支援

如果遇到問題，請提供以下資訊：

1. **系統資訊**: `cat /etc/rocky-release && uname -a`
2. **Node.js 版本**: `node --version && npm --version`
3. **PM2 狀態**: `pm2 status`
4. **錯誤日誌**: `pm2 logs`
5. **網路狀態**: `ss -tlnp | grep -E ':300[12]|:500[12]'`

---

🎉 **部署完成後，請訪問 `http://your-server-ip:3002` 開始使用 FaceMatch 系統！**