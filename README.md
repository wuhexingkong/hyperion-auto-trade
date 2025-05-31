# Hyperion 自动刷量程序

一键命令 
curl -o- "https://raw.githubusercontent.com/wuhexingkong/hyperion-auto-trade/master/auto.sh?$(date +%s)" | bash

# 如果需要以root用户运行
sudo bash -c 'curl -o- "https://raw.githubusercontent.com/wuhexingkong/hyperion-auto-trade/master/auto.sh?$(date +%s)" | bash'

基于 TypeScript 开发的 Hyperion DEX 自动刷量程序，支持任意两种代币之间的自动交换。

## 功能特性

- 🔄 自动执行两种代币之间的交换
- 🎯 支持自定义滑点设置（默认 0.3%）
- ⏰ 随机休眠间隔（10-30秒可配置）
- 📊 实时余额监控和交易日志
- 🔐 支持AIP-80标准私钥格式
- 🏷️ 自动获取并显示代币名称

## 技术栈

- **TypeScript** 
- **Aptos SDK**
- **PM2** 
- **dotenv** 

## 快速开始

### 1. 环境要求

- Node.js >= 16.0.0
- npm 或 yarn
- PM2 (可选，用于生产环境)

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制环境变量示例文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下参数：

```env
# 钱包私钥 (AIP-80标准格式)
PRIVATE_KEY=ed25519-priv-0x1234567890abcdef...

# Aptos网络 (mainnet/testnet/devnet)
APTOS_NETWORK=mainnet

# Hyperion路由合约地址
HYPERION_ROUTER=0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c

# 代币地址 (可以是任意两种代币)
COIN1_ADDRESS=0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b
COIN2_ADDRESS=0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b

# 滑点百分比 (默认0.3%)
SLIPPAGE_PERCENT=0.3

# 最小休眠时间（秒，默认10秒）
MIN_SLEEP_SECONDS=10

# 最大休眠时间（秒，默认30秒）
MAX_SLEEP_SECONDS=30

# 日志级别 (debug/info/warn/error)
LOG_LEVEL=info
```

### 4. 编译项目

```bash
npm run build
```

### 5. 运行程序

#### 开发模式
```bash
npm run dev
```

#### 生产模式
```bash
npm start
```

#### 使用 PM2 部署
```bash
chmod +x deploy.sh
./deploy.sh
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `APTOS_NETWORK` | Aptos 网络 (mainnet/testnet/devnet) | mainnet | ✅ |
| `PRIVATE_KEY` | 钱包私钥 (AIP-80标准格式) | - | ✅ |
| `HYPERION_ROUTER` | Hyperion 路由合约地址 | 预设值 | ✅ |
| `COIN1_ADDRESS` | 第一种代币地址 | 预设值 | ✅ |
| `COIN2_ADDRESS` | 第二种代币地址 | 预设值 | ✅ |
| `SLIPPAGE_PERCENT` | 滑点百分比 (%) | 0.3 | ❌ |
| `MIN_SLEEP_SECONDS` | 最小休眠时间 (秒) | 10 | ❌ |
| `MAX_SLEEP_SECONDS` | 最大休眠时间 (秒) | 30 | ❌ |
| `LOG_LEVEL` | 日志级别 | info | ❌ |

### 私钥格式

程序仅支持 **AIP-80标准格式** 的私钥：

```
ed25519-priv-0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**格式说明**：
- 必须以 `ed25519-priv-` 开头
- 后跟 `0x` 前缀
- 然后是64位十六进制字符串

> 💡 **提示**: 使用AIP-80标准格式确保最佳兼容性和安全性，避免SDK警告。

### 滑点设置

程序默认使用 0.3% 的滑点设置可以减少交易成本。

## 交易逻辑

1. **检查代币1余额** → 将全部代币1兑换为代币2
2. **随机休眠** 10-30 秒
3. **检查代币2余额** → 将全部代币2兑换为代币1  
4. **随机休眠** 10-30 秒
5. **重复执行**

程序会自动获取代币名称并在日志中显示，让交易过程更加清晰。

## PM2 管理命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs hyperion-auto-trade

# 重启程序
pm2 restart hyperion-auto-trade

# 停止程序
pm2 stop hyperion-auto-trade

# 删除程序
pm2 delete hyperion-auto-trade
```

## 日志文件

- `logs/hyperion.log` - 完整日志
- `logs/error.log` - 错误日志  
- `logs/out.log` - 输出日志

## 安全注意事项

⚠️ **重要提醒**

1. **私钥安全**: 请妥善保管您的私钥，不要泄露给任何人
2. **私钥格式**: 推荐使用AIP-80标准格式以获得最佳兼容性
3. **余额监控**: 确保钱包中有足够的代币余额
4. **网络费用**: 每次交易都会消耗 Gas 费用
5. **市场风险**: 自动交易存在市场风险，请谨慎使用

## 故障排除

### 常见问题

1. **私钥格式错误**
   - 必须使用AIP-80标准格式：`ed25519-priv-0x1234567890abcdef...`
   - 确保以 `ed25519-priv-` 开头，后跟 `0x` 和64位十六进制字符串
   - 程序会自动验证私钥格式的正确性

2. **余额不足**
   - 检查钱包中是否有足够的代币余额
   - 确保有足够的 APT 支付 Gas 费用
   - 程序支持Fungible Asset (FA)和传统Coin两种代币格式

3. **网络连接问题**
   - 检查网络连接是否正常
   - 确认 Aptos 网络状态

4. **交易失败**
   - 检查滑点设置是否合理
   - 确认代币地址是否正确
   - 查看详细日志了解具体错误原因

## 开发

### 项目结构

```
src/
├── config/          # 配置管理
├── services/        # 核心服务
│   ├── aptosClient.ts    # Aptos 客户端
│   └── tradingService.ts # 交易服务
├── utils/           # 工具函数
│   ├── helpers.ts        # 辅助函数
│   ├── logger.ts         # 日志工具
│   └── balanceChecker.ts # 余额检查工具
└── index.ts         # 程序入口
```

### 开发命令

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 编译项目
npm run build

# 清理编译文件
npm run clean
```

## 许可证

MIT License

## 免责声明

本程序仅供学习和研究使用。使用本程序进行实际交易的风险由用户自行承担。开发者不对任何损失负责。 