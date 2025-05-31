#!/bin/bash

# Hyperion 自动刷量程序 PM2 部署脚本

set -e

# 配置日志路径
LOG_DIR="/opt/hyperion-auto-trade/logs"

echo "🚀 开始部署 Hyperion 自动刷量程序..."

# 检查是否安装了 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 npm"
    exit 1
fi

# 检查是否安装了 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi

# 创建日志目录
echo "📁 创建日志目录..."
mkdir -p "$LOG_DIR"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  警告: 未找到 .env 文件"
    if [ -f "env.example" ]; then
        echo "📋 复制 env.example 到 .env"
        cp env.example .env
        echo "✏️  请编辑 .env 文件并配置您的私钥和其他参数"
        echo "📝 配置完成后，请重新运行此脚本"
        exit 1
    else
        echo "❌ 错误: 未找到 env.example 文件"
        exit 1
    fi
fi

# 停止现有的 PM2 进程（如果存在）
echo "🛑 停止现有进程..."
pm2 stop hyperion-auto-trade 2>/dev/null || true
pm2 delete hyperion-auto-trade 2>/dev/null || true

# 清理旧的编译文件
echo "🧹 清理旧的编译文件..."
rm -rf dist/

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 强制重新编译 TypeScript
echo "🔨 重新编译 TypeScript..."
npm run build

# 检查编译是否成功
if [ ! -f "dist/index.js" ]; then
    echo "❌ 错误: TypeScript 编译失败"
    exit 1
fi

echo "✅ 编译成功，生成文件: dist/index.js"

# 启动新的 PM2 进程
echo "🚀 启动 Hyperion 自动刷量程序..."
pm2 start dist/index.js \
    --name "hyperion-auto-trade" \
    --output "$LOG_DIR/out.log" \
    --error "$LOG_DIR/error.log" \
    --log "$LOG_DIR/hyperion.log" \
    --time \
    --restart-delay=5000 \
    --max-restarts=10 \
    --no-autorestart

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 查看状态: pm2 status"
echo "📋 查看日志: pm2 logs hyperion-auto-trade"
echo "🔄 重启程序: pm2 restart hyperion-auto-trade"
echo "🛑 停止程序: pm2 stop hyperion-auto-trade"
echo "🗑️  删除程序: pm2 delete hyperion-auto-trade"
echo ""
echo "📁 日志文件位置:"
echo "   - 完整日志: $LOG_DIR/hyperion.log"
echo "   - 错误日志: $LOG_DIR/error.log"
echo "   - 输出日志: $LOG_DIR/out.log"
echo ""
echo "⚠️  重要提醒:"
echo "   1. 请确保 .env 文件中的私钥配置正确"
echo "      - 仅支持AIP-80标准格式：ed25519-priv-0x1234..."
echo "      - 必须以 ed25519-priv- 开头，后跟0x和64位十六进制"
echo "   2. 请确保钱包中有足够的 USDT 或 USDC 余额"
echo "   3. 请定期检查程序运行状态和日志"
echo "   4. 建议在测试网先测试后再在主网运行"
echo "   5. 每次部署都会重新编译，确保使用最新代码"
echo "" 