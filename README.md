# Hyperion 自动刷量程序

一个基于 Aptos 区块链的 Hyperion DEX 自动刷量程序，专门用于 **USDT/USDC 交易对**的自动化交易。

## 风险提示！
代码是结合AI生成的，使用前请使用少量资金测试后再使用。

## ✨ 特性

- 🔄 **专业刷量**: 专门针对 USDT/USDC 交易对优化
- 🤖 **全自动化**: 无需人工干预，自动执行买卖操作
- ⚡ **高效稳定**: 基于 Hyperion DEX 的高性能交易
- 🛡️ **安全可靠**: 支持滑点保护和错误重试机制
- 📊 **实时监控**: 详细的交易日志和余额监控
- 🎯 **智能策略**: 随机交易间隔，模拟真实交易行为

## 🚀 一键安装

```bash
sudo curl -O "https://raw.githubusercontent.com/wuhexingkong/hyperion-auto-trade/master/auto.sh?$(date +%s)" && chmod +x auto.sh && ./auto.sh && source ~/.bashrc
```

### 🎯 验证安装

安装完成后，执行以下命令验证：

```bash
pm2 status
```

如果看到 `hyperion-auto-trade` 进程正在运行，说明安装成功！

### 📋 可选操作

```bash
# 设置开机自启（可选）
pm2 startup
# 然后复制并执行输出的sudo命令

# 查看实时日志
pm2 logs hyperion-auto-trade
```

详细安装说明请查看 [INSTALL.md](INSTALL.md)

## 📋 系统要求

- **操作系统**: Ubuntu 18.04+ / Debian 9+
- **Node.js**: v22.14.0 (自动安装)
- **内存**: 至少 1GB RAM
- **存储**: 至少 1GB 可用空间
- **网络**: 稳定的网络连接

## ⚙️ 配置说明

程序使用以下固定配置：

### 交易对
- **USDT**: `0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b`
- **USDC**: `0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b`

### 可配置参数
| 参数 | 说明 | 默认值 |
|------|------|--------|
| `PRIVATE_KEY` | 钱包私钥 (必须以 ed25519-priv- 开头) | 无 |
| `SLIPPAGE_PERCENT` | 滑点百分比 | 0.3% |
| `MIN_SLEEP_SECONDS` | 最小休眠时间 | 10秒 |
| `MAX_SLEEP_SECONDS` | 最大休眠时间 | 30秒 |

## 🔧 手动安装

如果一键安装失败，可以手动安装：

### 1. 克隆项目
```bash
git clone https://github.com/wuhexingkong/hyperion-auto-trade.git
cd hyperion-auto-trade
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
```bash
cp env.example .env
# 编辑 .env 文件，填入您的私钥和配置
```

### 4. 编译项目
```bash
npm run build
```

### 5. 启动程序
```bash
npm start
```

## 📊 使用说明

### 启动程序
```bash
# 使用 PM2 启动（推荐）
pm2 start ecosystem.config.js

# 或直接启动
npm start
```

### 查看日志
```bash
# PM2 日志
pm2 logs hyperion-auto-trade

# 文件日志
tail -f logs/hyperion.log
```

### 管理服务
```bash
# 查看状态
pm2 status

# 重启服务
pm2 restart hyperion-auto-trade

# 停止服务
pm2 stop hyperion-auto-trade

# 删除服务
pm2 delete hyperion-auto-trade
```

## 🔍 工作原理

1. **余额检查**: 程序启动时检查 USDT 和 USDC 余额
2. **随机交易**: 随机选择交易方向（USDT→USDC 或 USDC→USDT）
3. **智能分配**: 每次交易使用 10-50% 的可用余额
4. **滑点保护**: 自动计算最小输出金额，防止滑点过大
5. **循环执行**: 完成交易后随机休眠，然后继续下一轮

## 📁 项目结构

```
hyperion-auto-trade/
├── src/
│   ├── config/           # 配置管理
│   ├── services/         # 核心服务
│   │   ├── aptosClient.ts    # Aptos 客户端
│   │   └── tradingService.ts # 交易服务
│   ├── utils/            # 工具函数
│   │   ├── logger.ts         # 日志系统
│   │   ├── helpers.ts        # 辅助函数
│   │   └── balanceChecker.ts # 余额检查
│   └── index.ts          # 程序入口
├── logs/                 # 日志文件
├── auto.sh              # 一键安装脚本
├── deploy.sh            # 部署脚本
└── ecosystem.config.js  # PM2 配置
```

## 🛠️ 故障排除

### PM2环境变量问题

如果遇到 `pm2: command not found` 错误：

```bash
# 方法1: 重新加载环境变量
source ~/.bashrc

# 方法2: 手动加载NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22.14.0

```

### 常见问题

1. **余额为0无法交易**
   - 确保钱包中有 USDT 或 USDC
   - 确保有足够的 APT 支付 Gas 费用

2. **交易失败**
   - 检查网络连接
   - 检查滑点设置是否合理
   - 查看详细错误日志

3. **程序异常退出**
   ```bash
   pm2 logs hyperion-auto-trade
   ```

更多故障排除信息请查看 [INSTALL.md](INSTALL.md)

## 🛠️ 重要提醒

### 安全注意事项
1. **私钥安全**: 请妥善保管您的私钥，不要泄露给任何人
2. **资金安全**: 建议使用专门的交易钱包，不要存放大额资金
3. **网络安全**: 确保服务器网络安全，建议使用防火墙

### 风险提示
1. **市场风险**: 自动交易存在市场风险，请谨慎使用
2. **技术风险**: 程序可能因网络、合约等问题导致交易失败
3. **Gas费用**: 每次交易需要消耗 APT 作为 Gas 费用
4. **滑点风险**: 市场波动可能导致实际交易价格与预期不符

### 使用建议
1. **小额测试**: 建议先用小额资金测试程序功能
2. **监控运行**: 定期检查程序运行状态和交易日志
3. **余额管理**: 确保钱包中有足够的 USDT、USDC 和 APT
4. **及时更新**: 关注项目更新，及时升级到最新版本

## 📞 技术支持

- **GitHub Issues**: [提交问题](https://github.com/wuhexingkong/hyperion-auto-trade/issues)
- **文档**: [安装指南](INSTALL.md)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## ⚖️ 免责声明

本程序仅供学习和研究使用。使用本程序进行实际交易的风险由用户自行承担。开发者不对因使用本程序而导致的任何损失负责。

---
