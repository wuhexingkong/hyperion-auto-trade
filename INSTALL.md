# Hyperion 自动刷量程序 - 一键安装指南

## 🚀 快速安装

### 方法一：直接下载并运行

```bash
# 下载安装脚本
wget https://raw.githubusercontent.com/wuhexingkong/hyperion-auto-trade/master/auto.sh

# 或者使用 curl
curl -O https://raw.githubusercontent.com/wuhexingkong/hyperion-auto-trade/master/auto.sh

# 添加执行权限
chmod +x auto.sh

# 运行安装脚本
./auto.sh
```

### 方法二：一行命令安装

```bash
curl -o- https://raw.githubusercontent.com/wuhexingkong/hyperion-auto-trade/master/auto.sh | bash
```

## 📋 系统要求

- **操作系统**: Ubuntu 18.04+ / Debian 9+
- **用户权限**: 支持普通用户（需要 sudo 权限）或 root 用户
- **网络**: 需要稳定的网络连接
- **存储**: 至少 1GB 可用空间

## 👤 用户权限说明

脚本支持两种运行方式：

### 普通用户运行（推荐）
```bash
# 以普通用户身份运行（推荐）
./auto.sh
```
- ✅ **安全性高**: 程序以普通用户权限运行
- ✅ **权限隔离**: 降低系统风险
- ⚠️ **需要sudo**: 安装系统包时需要sudo权限

### Root用户运行
```bash
# 以root用户身份运行
sudo ./auto.sh
# 或者切换到root用户
su -
./auto.sh
```
- ⚠️ **高权限**: 程序以root权限运行
- ⚠️ **安全风险**: 需要额外注意安全性
- ✅ **无需sudo**: 直接安装所有依赖

## 🔧 安装过程

脚本将自动完成以下步骤：

1. **系统检查**: 验证系统兼容性
2. **依赖安装**: 
   - 更新系统包
   - 安装 Git、curl、wget 等基础工具
   - 安装 NVM (Node Version Manager) v0.40.3
   - 安装 Node.js v22.14.0
   - 安装 PM2 进程管理器
3. **项目设置**:
   - 创建 `/opt/hyperion-auto-trade` 目录
   - 克隆项目代码
   - 设置文件权限
4. **配置环境**:
   - 复制配置文件模板
   - 交互式配置环境变量
5. **部署启动**:
   - 编译项目
   - 使用 PM2 启动服务

## ⚙️ 配置参数

安装过程中需要配置以下参数：

| 参数 | 说明 | 示例 |
|------|------|------|
| `PRIVATE_KEY` | 钱包私钥 (必须以 ed25519-priv- 开头) | `ed25519-priv-0x123...` |
| `COIN1_ADDRESS` | 第一种代币地址 | 默认 USDT 地址 |
| `COIN2_ADDRESS` | 第二种代币地址 | 默认 USDC 地址 |
| `SLIPPAGE_PERCENT` | 滑点百分比 | 默认 0.3% |
| `MIN_SLEEP_SECONDS` | 最小休眠时间 | 默认 10 秒 |
| `MAX_SLEEP_SECONDS` | 最大休眠时间 | 默认 30 秒 |

## 📊 安装后管理

### PM2 常用命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs hyperion-auto-trade

# 重启服务
pm2 restart hyperion-auto-trade

# 停止服务
pm2 stop hyperion-auto-trade

# 删除服务
pm2 delete hyperion-auto-trade
```

### 日志文件位置

- **完整日志**: `/opt/hyperion-auto-trade/logs/hyperion.log`
- **错误日志**: `/opt/hyperion-auto-trade/logs/error.log`
- **输出日志**: `/opt/hyperion-auto-trade/logs/out.log`

## 🛠️ 故障排除

### 常见问题

1. **权限错误**
   ```bash
   # 普通用户
   sudo chown -R $USER:$USER /opt/hyperion-auto-trade
   
   # Root用户
   chown -R root:root /opt/hyperion-auto-trade
   ```

2. **Node.js 版本问题**
   ```bash
   # 重新加载环境变量
   source ~/.bashrc
   nvm use 22.14.0
   
   # Root用户可能需要
   source /root/.bashrc
   ```

3. **网络连接问题**
   - 检查防火墙设置
   - 验证 DNS 解析
   - 尝试使用代理

4. **PM2 服务未启动**
   ```bash
   cd /opt/hyperion-auto-trade
   ./deploy.sh
   ```

5. **Root用户特定问题**
   - **NVM路径问题**: Root用户的NVM安装在 `/root/.nvm/`
   - **权限问题**: 确保所有文件属于root用户
   - **环境变量**: 可能需要手动加载 `/root/.bashrc`

### 重新安装

如果需要重新安装，可以先清理环境：

```bash
# 停止并删除 PM2 服务
pm2 delete hyperion-auto-trade 2>/dev/null || true

# 删除项目目录
sudo rm -rf /opt/hyperion-auto-trade

# 重新运行安装脚本
./auto.sh
```

## ⚠️ 安全提醒

### 通用安全注意事项
1. **私钥安全**: 请妥善保管您的私钥，不要泄露给任何人
2. **资金安全**: 确保钱包中有足够的代币余额和 APT 支付 Gas 费用
3. **市场风险**: 自动交易存在市场风险，请谨慎使用
4. **监控运行**: 定期检查程序运行状态和日志

### Root用户特殊安全注意事项
如果以root用户运行，请额外注意：

1. **系统安全**: Root权限可能影响整个系统，确保服务器安全
2. **网络隔离**: 建议在隔离的网络环境中运行
3. **定期审计**: 定期检查系统日志和程序行为
4. **最小权限**: 考虑是否真的需要root权限，普通用户通常已足够
5. **备份重要**: 定期备份系统和配置文件

## 📞 技术支持

如果遇到问题，请：

1. 查看日志文件获取详细错误信息
2. 检查 [GitHub Issues](https://github.com/wuhexingkong/hyperion-auto-trade/issues)
3. 提交新的 Issue 并附上错误日志

---

**免责声明**: 本程序仅供学习和研究使用。使用本程序进行实际交易的风险由用户自行承担。 