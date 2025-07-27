#!/bin/bash

# =====================================================
# FaceMatch 企業級管理系統 - Rocky Linux 自動部署腳本
# =====================================================
# 適用於: Rocky Linux 8/9, CentOS 8+, RHEL 8+
# 功能: 環境檢查、軟體安裝、系統配置、自動部署
# =====================================================

set -e  # 遇到錯誤立即退出

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日誌函數
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查是否為 root 用戶
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "檢測到以 root 用戶執行"
        read -p "建議使用一般用戶執行部署，是否繼續？(y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "建議創建一般用戶後重新執行此腳本"
            exit 1
        fi
    fi
}

# 系統資訊檢查
check_system_info() {
    log_info "檢查系統資訊..."
    
    # 檢查作業系統
    if [[ -f /etc/rocky-release ]]; then
        OS_VERSION=$(cat /etc/rocky-release)
        log_success "檢測到 Rocky Linux: $OS_VERSION"
    elif [[ -f /etc/centos-release ]]; then
        OS_VERSION=$(cat /etc/centos-release)
        log_success "檢測到 CentOS: $OS_VERSION"
    elif [[ -f /etc/redhat-release ]]; then
        OS_VERSION=$(cat /etc/redhat-release)
        log_success "檢測到 RHEL: $OS_VERSION"
    else
        log_error "不支援的作業系統，此腳本適用於 Rocky Linux/CentOS/RHEL"
        exit 1
    fi
    
    # 檢查架構
    ARCH=$(uname -m)
    log_info "系統架構: $ARCH"
    
    # 檢查記憶體
    TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.1f", $2/1024}')
    log_info "總記憶體: ${TOTAL_MEM}GB"
    
    if (( $(echo "$TOTAL_MEM < 1.0" | bc -l) )); then
        log_warning "記憶體不足 1GB，可能影響系統性能"
    fi
    
    # 檢查磁碟空間
    DISK_AVAILABLE=$(df -h / | awk 'NR==2 {print $4}')
    log_info "根目錄可用空間: $DISK_AVAILABLE"
}

# 檢查網路連接
check_network() {
    log_info "檢查網路連接..."
    
    if ping -c 1 8.8.8.8 &> /dev/null; then
        log_success "網路連接正常"
    else
        log_error "無法連接到網際網路，請檢查網路設定"
        exit 1
    fi
    
    # 檢查 DNS
    if nslookup npmjs.com &> /dev/null; then
        log_success "DNS 解析正常"
    else
        log_warning "DNS 解析可能有問題"
    fi
}

# 更新系統
update_system() {
    log_info "更新系統套件..."
    
    # 檢查是否有 sudo 權限
    if sudo -n true 2>/dev/null; then
        log_info "檢測到 sudo 權限"
    else
        log_error "需要 sudo 權限來安裝系統套件"
        log_info "請確保當前用戶在 sudoers 中，或聯絡系統管理員"
        exit 1
    fi
    
    # 更新套件索引
    sudo dnf update -y
    log_success "系統套件更新完成"
}

# 安裝基礎工具
install_basic_tools() {
    log_info "安裝基礎開發工具..."
    
    # 開發工具組
    sudo dnf groupinstall -y "Development Tools"
    
    # 必要工具
    sudo dnf install -y \
        curl \
        wget \
        git \
        unzip \
        which \
        bc \
        screen \
        tmux \
        htop \
        tree \
        vim \
        nano
    
    log_success "基礎工具安裝完成"
}

# 安裝 Node.js
install_nodejs() {
    log_info "檢查 Node.js 安裝狀態..."
    
    # 檢查是否已安裝 Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_info "已安裝 Node.js 版本: $NODE_VERSION"
        
        # 檢查版本是否足夠 (需要 Node.js 18+)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [[ $NODE_MAJOR -ge 18 ]]; then
            log_success "Node.js 版本符合要求"
            return
        else
            log_warning "Node.js 版本過舊，將安裝最新版本"
        fi
    else
        log_info "未檢測到 Node.js，將進行安裝"
    fi
    
    # 安裝 Node.js 20 LTS
    log_info "安裝 Node.js 20 LTS..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
    
    # 驗證安裝
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        NODE_VERSION=$(node --version)
        NPM_VERSION=$(npm --version)
        log_success "Node.js 安裝成功: $NODE_VERSION"
        log_success "npm 版本: $NPM_VERSION"
    else
        log_error "Node.js 安裝失敗"
        exit 1
    fi
}

# 安裝 PM2
install_pm2() {
    log_info "安裝 PM2 進程管理器..."
    
    # 檢查是否已安裝 PM2
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        log_info "已安裝 PM2 版本: $PM2_VERSION"
    else
        # 全域安裝 PM2
        sudo npm install -g pm2
        
        # 驗證安裝
        if command -v pm2 &> /dev/null; then
            PM2_VERSION=$(pm2 --version)
            log_success "PM2 安裝成功: $PM2_VERSION"
        else
            log_error "PM2 安裝失敗"
            exit 1
        fi
    fi
    
    # 設定 PM2 開機啟動
    log_info "設定 PM2 開機啟動..."
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
    
    # 創建 PM2 log 目錄
    mkdir -p ~/.pm2/logs
    
    log_success "PM2 設定完成"
}

# 配置防火牆
configure_firewall() {
    log_info "配置防火牆設定..."
    
    # 檢查防火牆狀態
    if systemctl is-active --quiet firewalld; then
        log_info "檢測到 firewalld 正在運行"
        
        # 開放必要端口
        sudo firewall-cmd --permanent --add-port=3002/tcp  # 前端
        sudo firewall-cmd --permanent --add-port=5001/tcp  # 後端 JS
        sudo firewall-cmd --permanent --add-port=5002/tcp  # 後端 TS
        sudo firewall-cmd --reload
        
        log_success "防火牆規則已更新"
    else
        log_warning "firewalld 未運行，跳過防火牆配置"
    fi
}

# 配置 SELinux (如果啟用)
configure_selinux() {
    log_info "檢查 SELinux 狀態..."
    
    if command -v getenforce &> /dev/null; then
        SELINUX_STATUS=$(getenforce)
        log_info "SELinux 狀態: $SELINUX_STATUS"
        
        if [[ "$SELINUX_STATUS" == "Enforcing" ]]; then
            log_warning "SELinux 處於強制模式，可能需要額外配置"
            log_info "如果遇到權限問題，可考慮臨時設為 Permissive 模式："
            log_info "sudo setenforce 0"
        fi
    fi
}

# 創建專案目錄
create_project_directory() {
    log_info "創建專案目錄..."
    
    # 預設安裝路徑
    DEFAULT_PATH="$HOME/facematch"
    read -p "請輸入安裝路徑 (預設: $DEFAULT_PATH): " PROJECT_PATH
    PROJECT_PATH=${PROJECT_PATH:-$DEFAULT_PATH}
    
    # 檢查目錄是否存在
    if [[ -d "$PROJECT_PATH" ]]; then
        log_warning "目錄已存在: $PROJECT_PATH"
        read -p "是否要備份現有目錄並繼續？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            BACKUP_PATH="${PROJECT_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
            mv "$PROJECT_PATH" "$BACKUP_PATH"
            log_info "已備份到: $BACKUP_PATH"
        else
            log_info "部署已取消"
            exit 0
        fi
    fi
    
    # 創建目錄
    mkdir -p "$PROJECT_PATH"
    cd "$PROJECT_PATH"
    
    log_success "專案目錄創建完成: $PROJECT_PATH"
    export PROJECT_PATH
}

# 下載專案檔案
download_project() {
    log_info "準備下載專案檔案..."
    
    echo "請選擇獲取專案檔案的方式："
    echo "1) 從 Git 倉庫克隆 (如果有)"
    echo "2) 手動上傳檔案 (scp/sftp)"
    echo "3) 稍後手動複製"
    
    read -p "請選擇 (1/2/3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            read -p "請輸入 Git 倉庫 URL: " GIT_URL
            if [[ -n "$GIT_URL" ]]; then
                git clone "$GIT_URL" .
                log_success "專案檔案下載完成"
            else
                log_warning "未提供 Git URL，跳過下載"
            fi
            ;;
        2)
            log_info "請使用以下命令從源機器上傳檔案："
            log_info "scp -r /path/to/FaceMatch/* user@$(hostname -I | awk '{print $1}'):$PROJECT_PATH/"
            log_info "或使用 rsync:"
            log_info "rsync -avz /path/to/FaceMatch/ user@$(hostname -I | awk '{print $1}'):$PROJECT_PATH/"
            read -p "檔案上傳完成後請按 Enter 繼續..."
            ;;
        3)
            log_info "請稍後手動複製專案檔案到: $PROJECT_PATH"
            log_info "複製完成後可執行: cd $PROJECT_PATH && ./deploy-rocky.sh install"
            ;;
    esac
}

# 安裝專案依賴
install_dependencies() {
    log_info "安裝專案依賴..."
    
    # 檢查 package.json
    if [[ ! -f "package.json" ]]; then
        log_error "找不到 package.json 檔案，請確保專案檔案已正確複製"
        exit 1
    fi
    
    # 安裝依賴
    npm install
    
    # 檢查安裝結果
    if [[ $? -eq 0 ]]; then
        log_success "依賴安裝完成"
    else
        log_error "依賴安裝失敗"
        exit 1
    fi
}

# 配置環境變數
configure_environment() {
    log_info "配置環境變數..."
    
    # 檢查 .env.example
    if [[ -f ".env.example" ]]; then
        if [[ ! -f ".env" ]]; then
            cp .env.example .env
            log_success "已創建 .env 檔案"
        else
            log_info ".env 檔案已存在"
        fi
        
        log_warning "請編輯 .env 檔案設定系統參數："
        log_info "vim .env  或  nano .env"
        log_info "重要設定項目："
        log_info "- DEFAULT_ADMIN_PASSWORD (管理員密碼)"
        log_info "- DEFAULT_SAFETY_PASSWORD (職環安密碼)"
        log_info "- DEFAULT_MANAGER_PASSWORD (經理密碼)"
        log_info "- BCRYPT_SALT_ROUNDS (密碼加密強度)"
        
        read -p "是否現在編輯 .env 檔案？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            ${EDITOR:-nano} .env
        fi
    else
        log_warning "找不到 .env.example 檔案"
    fi
}

# 建置專案
build_project() {
    log_info "建置專案..."
    
    # TypeScript 編譯
    if [[ -f "tsconfig.json" ]]; then
        log_info "編譯 TypeScript..."
        npx tsc
        
        # 複製文檔檔案
        if [[ -d "src/docs" ]]; then
            mkdir -p dist/docs
            cp src/docs/*.yml dist/docs/ 2>/dev/null || true
        fi
        
        log_success "TypeScript 編譯完成"
    fi
    
    # 前端建置 (如果存在)
    if [[ -d "client" && -f "client/package.json" ]]; then
        log_info "建置前端專案..."
        cd client
        npm install
        npm run build
        cd ..
        log_success "前端建置完成"
    fi
}

# 啟動服務
start_services() {
    log_info "啟動 FaceMatch 服務..."
    
    # 檢查啟動腳本
    if [[ -f "start-pm2.sh" ]]; then
        # 確保腳本有執行權限
        chmod +x start-pm2.sh
        
        # 修復 CRLF 問題 (如果是從 Windows 複製的)
        sed -i 's/\r$//' start-pm2.sh
        
        # 執行啟動腳本
        ./start-pm2.sh
        
        log_success "服務啟動完成"
    else
        log_warning "找不到 start-pm2.sh 腳本，使用手動啟動"
        
        # 手動啟動
        if [[ -f "ecosystem.config.js" ]]; then
            pm2 start ecosystem.config.js
            pm2 save
            log_success "服務已啟動"
        else
            log_error "找不到 PM2 配置檔案"
            exit 1
        fi
    fi
}

# 系統服務設定
setup_system_service() {
    log_info "設定系統服務..."
    
    # 保存 PM2 配置
    pm2 save
    
    # 生成系統服務
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
    
    log_success "系統服務設定完成"
    log_info "系統重啟後服務將自動啟動"
}

# 驗證部署
verify_deployment() {
    log_info "驗證部署結果..."
    
    # 檢查 PM2 服務狀態
    if pm2 list | grep -q "online"; then
        log_success "PM2 服務運行正常"
        
        # 顯示服務狀態
        pm2 status
        
        # 檢查端口
        sleep 5
        
        local success=true
        
        # 檢查前端服務 (Port 3002)
        if curl -f http://localhost:3002 &>/dev/null; then
            log_success "前端服務 (Port 3002) 運行正常"
        else
            log_error "前端服務 (Port 3002) 無法訪問"
            success=false
        fi
        
        # 檢查後端服務 (Port 5001)
        if curl -f http://localhost:5001/health &>/dev/null; then
            log_success "後端服務 (Port 5001) 運行正常"
        else
            log_warning "後端服務 (Port 5001) 無法訪問"
        fi
        
        # 檢查 TypeScript 後端 (Port 5002)
        if curl -f http://localhost:5002/health &>/dev/null; then
            log_success "TypeScript 後端 (Port 5002) 運行正常"
        else
            log_warning "TypeScript 後端 (Port 5002) 無法訪問"
        fi
        
        if $success; then
            log_success "✅ 部署驗證通過！"
        else
            log_warning "⚠️ 部分服務可能有問題，請檢查日誌"
        fi
    else
        log_error "PM2 服務啟動失敗"
        pm2 logs
        exit 1
    fi
}

# 顯示部署資訊
show_deployment_info() {
    echo
    echo "=========================================="
    log_success "🎉 FaceMatch 系統部署完成！"
    echo "=========================================="
    echo
    log_info "📍 專案路徑: $PROJECT_PATH"
    log_info "🌐 前端地址: http://$(hostname -I | awk '{print $1}'):3002"
    log_info "🔧 後端 API: http://$(hostname -I | awk '{print $1}'):5001"
    log_info "📖 API 文檔: http://$(hostname -I | awk '{print $1}'):5002/api-docs"
    echo
    log_info "👤 預設登入帳號:"
    log_info "   管理員: admin / (請查看 .env 檔案)"
    log_info "   職環安: safety / (請查看 .env 檔案)"
    log_info "   經理: manager / (請查看 .env 檔案)"
    echo
    log_info "🔧 常用管理命令:"
    log_info "   pm2 status          # 查看服務狀態"
    log_info "   pm2 logs            # 查看服務日誌"
    log_info "   pm2 restart all     # 重啟所有服務"
    log_info "   pm2 stop all        # 停止所有服務"
    log_info "   pm2 reload all      # 熱重載服務"
    echo
    log_warning "⚠️ 安全提醒:"
    log_warning "1. 請修改 .env 檔案中的預設密碼"
    log_warning "2. 確保防火牆已正確配置"
    log_warning "3. 建議定期備份資料庫檔案"
    echo "=========================================="
}

# 主函數
main() {
    # 歡迎訊息
    echo "=========================================="
    echo "🚀 FaceMatch 企業級管理系統"
    echo "   Rocky Linux 自動部署腳本"
    echo "=========================================="
    echo
    
    # 檢查參數
    case "${1:-}" in
        "check")
            log_info "執行環境檢查..."
            check_system_info
            check_network
            log_success "環境檢查完成"
            ;;
        "install")
            log_info "執行完整安裝流程..."
            install_dependencies
            configure_environment
            build_project
            start_services
            verify_deployment
            show_deployment_info
            ;;
        "")
            # 完整部署流程
            check_root
            check_system_info
            check_network
            update_system
            install_basic_tools
            install_nodejs
            install_pm2
            configure_firewall
            configure_selinux
            create_project_directory
            download_project
            
            # 如果有專案檔案才繼續
            if [[ -f "package.json" ]]; then
                install_dependencies
                configure_environment
                build_project
                start_services
                setup_system_service
                verify_deployment
                show_deployment_info
            else
                log_info "專案檔案準備完成後，請執行："
                log_info "cd $PROJECT_PATH && ./deploy-rocky.sh install"
            fi
            ;;
        *)
            echo "用法: $0 [check|install]"
            echo "  check   - 僅執行環境檢查"
            echo "  install - 安裝專案 (需要專案檔案已存在)"
            echo "  (無參數) - 完整部署流程"
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@"