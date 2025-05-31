#!/bin/bash

# Hyperion 自动刷量程序一键安装脚本
# 适用于 Ubuntu 系统

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warn "检测到以root用户运行"
        log_info "将以root用户身份安装，请确保这是您想要的"
        
        # 设置默认用户为root
        INSTALL_USER="root"
        INSTALL_HOME="/root"
    else
        INSTALL_USER="$USER"
        INSTALL_HOME="$HOME"
    fi
    
    log_info "安装用户: $INSTALL_USER"
    log_info "用户主目录: $INSTALL_HOME"
}

# 检查系统兼容性
check_system() {
    log_step "检查系统兼容性..."
    
    # 检查是否为Linux系统
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "此脚本仅支持Linux系统"
        exit 1
    fi
    
    # 检查是否为Ubuntu/Debian系统
    if ! command -v apt &> /dev/null; then
        log_error "此脚本需要apt包管理器（Ubuntu/Debian系统）"
        exit 1
    fi
    
    # 检查Ubuntu版本（可选）
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        log_info "检测到系统: $NAME $VERSION"
        
        # 检查是否为支持的Ubuntu版本
        case $VERSION_ID in
            "18.04"|"20.04"|"22.04"|"24.04")
                log_info "系统版本兼容"
                ;;
            *)
                log_warn "未测试的系统版本，可能存在兼容性问题"
                ;;
        esac
    fi
}

# 更新系统包
update_system() {
    log_step "更新系统包列表..."
    
    # 根据用户权限决定是否使用sudo
    if [[ $EUID -eq 0 ]]; then
        SUDO_CMD=""
    else
        SUDO_CMD="sudo"
    fi
    
    # 更新包列表
    $SUDO_CMD apt update
    
    # 安装基础依赖
    log_info "安装基础依赖包..."
    $SUDO_CMD apt install -y curl wget build-essential software-properties-common
    
    # 检查网络连接
    if ! curl -s --connect-timeout 10 https://www.google.com > /dev/null; then
        log_warn "网络连接可能存在问题，请检查网络设置"
    fi
}

# 检查Node.js版本
check_nodejs() {
    log_step "检查Node.js安装状态..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | sed 's/v//')
        REQUIRED_VERSION="16.0.0"
        
        # 版本比较函数
        version_compare() {
            echo "$1 $2" | awk '{
                split($1, a, ".");
                split($2, b, ".");
                for (i = 1; i <= 3; i++) {
                    if (a[i] < b[i]) exit 1;
                    if (a[i] > b[i]) exit 0;
                }
                exit 0;
            }'
        }
        
        if version_compare "$NODE_VERSION" "$REQUIRED_VERSION"; then
            log_info "Node.js 版本 $NODE_VERSION 满足要求 (>= $REQUIRED_VERSION)"
            return 0
        else
            log_warn "Node.js 版本 $NODE_VERSION 不满足要求 (>= $REQUIRED_VERSION)"
            return 1
        fi
    else
        log_warn "Node.js 未安装"
        return 1
    fi
}

# 安装NVM和Node.js
install_nodejs() {
    log_step "安装NVM和Node.js v22.14.0..."
    
    # 检查NVM是否已安装
    if ! command -v nvm &> /dev/null && [ ! -s "$INSTALL_HOME/.nvm/nvm.sh" ]; then
        log_info "安装NVM v0.40.3..."
        
        # 使用官方推荐的安装命令
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
        
        # 重新加载bash配置
        export NVM_DIR="$INSTALL_HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        
        # 验证NVM安装
        if [ -s "$NVM_DIR/nvm.sh" ]; then
            log_info "NVM 安装成功"
        else
            log_error "NVM 安装失败"
            exit 1
        fi
    else
        log_info "NVM 已安装，跳过安装步骤"
        # 确保NVM已加载
        export NVM_DIR="$INSTALL_HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # 安装Node.js v22.14.0
    log_info "安装Node.js v22.14.0..."
    
    # 检查是否已安装指定版本
    if nvm list | grep -q "v22.14.0"; then
        log_info "Node.js v22.14.0 已安装，设置为默认版本"
        nvm use 22.14.0
        nvm alias default 22.14.0
    else
        log_info "开始安装Node.js v22.14.0..."
        nvm install 22.14.0
        nvm use 22.14.0
        nvm alias default 22.14.0
    fi
    
    # 验证安装
    if command -v node &> /dev/null; then
        log_info "Node.js 安装完成，版本: $(node -v)"
        log_info "NPM 版本: $(npm -v)"
    else
        log_error "Node.js 安装失败"
        exit 1
    fi
    
    # 添加NVM到当前会话的PATH（如果需要）
    if ! command -v node &> /dev/null; then
        log_info "重新加载NVM环境..."
        source "$INSTALL_HOME/.bashrc" 2>/dev/null || true
        source "$INSTALL_HOME/.profile" 2>/dev/null || true
    fi
}

# 检查并安装Git
check_install_git() {
    log_step "检查Git安装状态..."
    
    if command -v git &> /dev/null; then
        log_info "Git 已安装，版本: $(git --version)"
    else
        log_info "安装Git..."
        $SUDO_CMD apt install -y git
        log_info "Git 安装完成，版本: $(git --version)"
    fi
}

# 检查并安装NPM
check_install_npm() {
    log_step "检查NPM安装状态..."
    
    if command -v npm &> /dev/null; then
        log_info "NPM 已安装，版本: $(npm -v)"
    else
        log_error "NPM 未安装，这通常不应该发生（Node.js应该包含NPM）"
        exit 1
    fi
}

# 检查并安装PM2
check_install_pm2() {
    log_step "检查PM2安装状态..."
    
    # 确保NVM环境已加载
    reload_node_env
    
    if command -v pm2 &> /dev/null; then
        log_info "PM2 已安装，版本: $(pm2 -v)"
    else
        log_info "安装PM2..."
        
        # 根据用户权限决定安装方式
        if [[ $EUID -eq 0 ]]; then
            # root用户全局安装
            npm install -g pm2
        else
            # 普通用户也全局安装（npm会处理权限）
            npm install -g pm2
        fi
        
        # 重新加载环境变量以确保PM2可用
        reload_node_env
        
        # 验证PM2安装
        if command -v pm2 &> /dev/null; then
            log_info "PM2 安装完成，版本: $(pm2 -v)"
        else
            log_error "PM2 安装失败，尝试重新加载环境变量..."
            
            # 强制重新加载环境变量
            force_reload_env
            
            # 再次检查
            if command -v pm2 &> /dev/null; then
                log_info "PM2 现在可用，版本: $(pm2 -v)"
            else
                log_error "PM2 仍然不可用，请手动检查安装"
                exit 1
            fi
        fi
    fi
}

# 重新加载Node.js环境变量
reload_node_env() {
    log_info "重新加载Node.js环境变量..."
    
    # 加载NVM环境
    export NVM_DIR="$INSTALL_HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        
        # 使用正确的Node.js版本
        nvm use 22.14.0 2>/dev/null || nvm use default 2>/dev/null || true
    fi
    
    # 重新加载bash配置文件
    [ -f "$INSTALL_HOME/.bashrc" ] && source "$INSTALL_HOME/.bashrc" 2>/dev/null || true
    [ -f "$INSTALL_HOME/.profile" ] && source "$INSTALL_HOME/.profile" 2>/dev/null || true
}

# 强制重新加载所有环境变量
force_reload_env() {
    log_warn "强制重新加载环境变量..."
    
    # 重新加载NVM
    export NVM_DIR="$INSTALL_HOME/.nvm"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
        
        # 确保使用正确版本
        nvm use 22.14.0 2>/dev/null || nvm use default 2>/dev/null || true
        
        log_info "当前Node.js版本: $(node -v 2>/dev/null || echo '未找到')"
        log_info "当前NPM版本: $(npm -v 2>/dev/null || echo '未找到')"
    fi
    
    # 重新加载所有配置文件
    for config_file in "$INSTALL_HOME/.bashrc" "$INSTALL_HOME/.profile" "$INSTALL_HOME/.bash_profile"; do
        if [ -f "$config_file" ]; then
            source "$config_file" 2>/dev/null || true
            log_info "已重新加载: $config_file"
        fi
    done
    
    # 手动添加npm全局bin目录到PATH
    if command -v npm &> /dev/null; then
        NPM_GLOBAL_PATH=$(npm config get prefix 2>/dev/null)/bin
        if [ -d "$NPM_GLOBAL_PATH" ] && [[ ":$PATH:" != *":$NPM_GLOBAL_PATH:"* ]]; then
            export PATH="$NPM_GLOBAL_PATH:$PATH"
            log_info "已添加npm全局bin目录到PATH: $NPM_GLOBAL_PATH"
        fi
    fi
}

# 创建项目目录并克隆代码
setup_project() {
    log_step "设置项目目录..."
    
    PROJECT_DIR="/opt/hyperion-auto-trade"
    
    # 检查/opt目录权限
    if [ ! -w "/opt" ] && [ ! -d "$PROJECT_DIR" ] && [[ $EUID -ne 0 ]]; then
        log_info "需要sudo权限创建 $PROJECT_DIR 目录"
    fi
    
    # 强制创建目录
    if [ -d "$PROJECT_DIR" ]; then
        log_warn "目录 $PROJECT_DIR 已存在，将删除并重新创建"
        if [[ $EUID -eq 0 ]]; then
            rm -rf "$PROJECT_DIR"
        else
            sudo rm -rf "$PROJECT_DIR"
        fi
    fi
    
    # 创建目录
    if [[ $EUID -eq 0 ]]; then
        mkdir -p "$PROJECT_DIR"
        # root用户直接拥有目录
    else
        sudo mkdir -p "$PROJECT_DIR"
        sudo chown $INSTALL_USER:$INSTALL_USER "$PROJECT_DIR"
    fi
    
    cd "$PROJECT_DIR"
    
    log_info "克隆项目代码..."
    
    # 尝试克隆项目，添加重试机制
    CLONE_SUCCESS=false
    for i in {1..3}; do
        if git clone https://github.com/wuhexingkong/hyperion-auto-trade.git .; then
            CLONE_SUCCESS=true
            break
        else
            log_warn "克隆失败，第 $i 次重试..."
            sleep 2
        fi
    done
    
    if [ "$CLONE_SUCCESS" = false ]; then
        log_error "项目克隆失败，请检查网络连接或仓库地址"
        exit 1
    fi
    
    # 检查关键文件是否存在
    if [ ! -f "deploy.sh" ]; then
        log_error "deploy.sh 文件不存在，项目可能不完整"
        exit 1
    fi
    
    if [ ! -f "env.example" ]; then
        log_error "env.example 文件不存在，项目可能不完整"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 文件不存在，项目可能不完整"
        exit 1
    fi
    
    # 给deploy.sh执行权限
    chmod +x deploy.sh
    
    # 确保目录权限正确
    if [[ $EUID -eq 0 ]]; then
        # root用户拥有所有文件
        chown -R root:root "$PROJECT_DIR"
    else
        # 普通用户需要sudo设置权限
        sudo chown -R $INSTALL_USER:$INSTALL_USER "$PROJECT_DIR"
    fi
    
    log_info "项目代码克隆完成，所有必要文件已验证"
}

# 配置环境变量
configure_env() {
    log_step "配置环境变量..."
    
    # 复制配置文件
    cp env.example .env
    
    echo
    echo "=== 配置环境变量 ==="
    echo "本程序专门用于 USDT/USDC 交易对刷量"
    echo
    
    # 输入私钥
    while true; do
        echo -n "请输入钱包私钥 (PRIVATE_KEY，必须以ed25519-priv-开头): "
        
        # 尝试从终端直接读取，如果失败则使用标准输入
        if [ -c /dev/tty ]; then
            read -s PRIVATE_KEY < /dev/tty
        else
            read -s PRIVATE_KEY
        fi
        echo  # 换行
        
        if [[ "$PRIVATE_KEY" =~ ^ed25519-priv- ]]; then
            break
        else
            log_error "私钥格式错误，必须以 ed25519-priv- 开头"
        fi
    done
    
    # 输入滑点百分比
    echo -n "请输入滑点百分比 (SLIPPAGE_PERCENT，默认0.3%): "
    if [ -c /dev/tty ]; then
        read -r SLIPPAGE_PERCENT < /dev/tty
    else
        read -r SLIPPAGE_PERCENT
    fi
    if [ -z "$SLIPPAGE_PERCENT" ]; then
        SLIPPAGE_PERCENT="0.3"
    fi
    
    # 输入最小休眠时间
    echo -n "请输入最小休眠时间秒数 (MIN_SLEEP_SECONDS，默认10s): "
    if [ -c /dev/tty ]; then
        read -r MIN_SLEEP_SECONDS < /dev/tty
    else
        read -r MIN_SLEEP_SECONDS
    fi
    if [ -z "$MIN_SLEEP_SECONDS" ]; then
        MIN_SLEEP_SECONDS="10"
    fi
    
    # 输入最大休眠时间
    echo -n "请输入最大休眠时间秒数 (MAX_SLEEP_SECONDS，默认30s): "
    if [ -c /dev/tty ]; then
        read -r MAX_SLEEP_SECONDS < /dev/tty
    else
        read -r MAX_SLEEP_SECONDS
    fi
    if [ -z "$MAX_SLEEP_SECONDS" ]; then
        MAX_SLEEP_SECONDS="30"
    fi
    
    # 修改配置文件
    log_info "更新配置文件..."
    
    # 使用更安全的方式替换配置值，避免特殊字符问题
    # 创建临时文件
    TEMP_ENV=$(mktemp)
    
    # 逐行处理配置文件
    while IFS= read -r line; do
        case "$line" in
            PRIVATE_KEY=*)
                echo "PRIVATE_KEY=$PRIVATE_KEY" >> "$TEMP_ENV"
                ;;
            SLIPPAGE_PERCENT=*)
                echo "SLIPPAGE_PERCENT=$SLIPPAGE_PERCENT" >> "$TEMP_ENV"
                ;;
            MIN_SLEEP_SECONDS=*)
                echo "MIN_SLEEP_SECONDS=$MIN_SLEEP_SECONDS" >> "$TEMP_ENV"
                ;;
            MAX_SLEEP_SECONDS=*)
                echo "MAX_SLEEP_SECONDS=$MAX_SLEEP_SECONDS" >> "$TEMP_ENV"
                ;;
            *)
                echo "$line" >> "$TEMP_ENV"
                ;;
        esac
    done < .env
    
    # 替换原文件
    mv "$TEMP_ENV" .env
    
    log_info "配置文件更新完成"
    
    # 验证配置文件（不显示私钥）
    log_info "配置验证："
    echo "  交易对: USDT/USDC (固定)"
    echo "  USDT地址: 0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"
    echo "  USDC地址: 0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b"
    echo "  SLIPPAGE_PERCENT: $SLIPPAGE_PERCENT%"
    echo "  MIN_SLEEP_SECONDS: ${MIN_SLEEP_SECONDS}s"
    echo "  MAX_SLEEP_SECONDS: ${MAX_SLEEP_SECONDS}s"
    echo "  PRIVATE_KEY: [已设置，长度: ${#PRIVATE_KEY} 字符]"
}

# 部署项目
deploy_project() {
    log_step "部署项目..."
    
    # 确保在项目目录中
    cd /opt/hyperion-auto-trade
    
    # 确保Node.js和PM2环境可用
    reload_node_env
    
    # 验证配置文件
    if [ ! -f ".env" ]; then
        log_error ".env 配置文件不存在"
        exit 1
    fi
    
    # 检查配置文件中的关键配置
    if ! grep -q "PRIVATE_KEY=ed25519-priv-" .env; then
        log_error "配置文件中私钥格式不正确"
        exit 1
    fi
    
    log_info "开始执行部署脚本..."
    
    # 执行部署脚本
    if ./deploy.sh; then
        log_info "项目部署成功"
    else
        log_error "项目部署失败，请检查错误信息"
        exit 1
    fi
    
    # 等待服务启动
    sleep 5
    
    # 再次确保PM2环境可用
    reload_node_env
    
    # 检查服务状态
    log_info "检查服务状态..."
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "hyperion-auto-trade"; then
            log_info "服务启动成功"
            pm2 status
        else
            log_warn "服务可能未正常启动，请手动检查"
            log_info "尝试显示PM2进程列表："
            pm2 list || log_warn "无法获取PM2进程列表"
        fi
    else
        log_error "PM2命令不可用，无法检查服务状态"
        log_info "请手动运行以下命令检查："
        echo "  source ~/.bashrc"
        echo "  pm2 status"
    fi
}

# 显示完成信息
show_completion() {
    echo
    echo "========================================"
    log_info "🎉 Hyperion 自动刷量程序安装完成！"
    echo "========================================"
    echo
    echo "项目目录: /opt/hyperion-auto-trade"
    echo "安装用户: $INSTALL_USER"
    echo
    
    # 检查服务状态
    reload_node_env
    
    if command -v pm2 &> /dev/null; then
        log_info "✅ PM2 环境正常，版本: $(pm2 -v)"
        
        if pm2 list | grep -q "hyperion-auto-trade"; then
            log_info "✅ 服务已启动成功"
            echo
            pm2 status
        else
            log_warn "⚠️  服务可能未正常启动"
        fi
        
        echo
        echo "📋 常用管理命令："
        echo "   pm2 status                        # 查看状态"
        echo "   pm2 logs hyperion-auto-trade      # 查看日志"
        echo "   pm2 restart hyperion-auto-trade   # 重启程序"
        echo "   pm2 stop hyperion-auto-trade      # 停止程序"
        echo
        echo "📋 可选操作："
        echo "   pm2 startup                       # 设置开机自启"
        echo "   # 然后复制并执行输出的sudo命令"
        
    else
        log_error "❌ PM2 环境异常，请重新运行安装脚本"
    fi
    
    echo
    echo "📁 日志文件位置："
    echo "  完整日志: /opt/hyperion-auto-trade/logs/hyperion.log"
    echo "  错误日志: /opt/hyperion-auto-trade/logs/error.log"
    echo "  输出日志: /opt/hyperion-auto-trade/logs/out.log"
    echo
    
    log_warn "⚠️  重要提醒："
    echo "  1. 请确保钱包中有足够的代币余额"
    echo "  2. 请确保有足够的APT支付Gas费用"
    echo "  3. 自动交易存在市场风险，请谨慎使用"
    echo "  4. 请妥善保管您的私钥，不要泄露给任何人"
    echo
    
    echo "🚀 安装完成！程序已自动启动。"
}

# 主函数
main() {
    echo "========================================"
    echo "🚀 Hyperion 自动刷量程序一键安装脚本"
    echo "========================================"
    echo
    
    # 检查root用户
    check_root
    
    # 检查系统兼容性
    check_system
    
    # 更新系统
    update_system
    
    # 检查并安装Node.js
    if ! check_nodejs; then
        install_nodejs
    fi
    
    # 检查并安装Git
    check_install_git
    
    # 检查NPM
    check_install_npm
    
    # 检查PM2
    check_install_pm2
    
    # 设置项目
    setup_project
    
    # 配置环境变量
    configure_env
    
    # 部署项目
    deploy_project
    
    # 显示完成信息
    show_completion
}

# 错误处理
trap 'log_error "脚本执行失败，请检查错误信息"; exit 1' ERR

# 执行主函数
main "$@" 