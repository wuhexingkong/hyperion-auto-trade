import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { TradingService } from './services/tradingService.js';
import { BalanceChecker } from './utils/balanceChecker.js';

// 全局变量
let tradingService: TradingService;

/**
 * 优雅关闭处理
 */
function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    logger.info(`收到 ${signal} 信号，正在优雅关闭...`);
    
    if (tradingService) {
      tradingService.stopTrading();
    }
    
    // 等待一段时间让正在进行的交易完成
    setTimeout(() => {
      logger.info('程序已退出');
      process.exit(0);
    }, 5000);
  };

  // 监听退出信号
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`未处理的Promise拒绝: ${reason}`);
    shutdown('unhandledRejection');
  });
}

/**
 * 显示启动信息
 */
function displayStartupInfo(): void {
  logger.info('🚀 启动 Hyperion 自动刷量程序');
  logger.info('=====================================');
  
  // 显示配置信息
  logger.info('📋 配置信息:');
  logger.info(`  USDT地址: ${config.usdtAddress}`);
  logger.info(`  USDC地址: ${config.usdcAddress}`);
  logger.info(`  滑点设置: ${config.slippagePercent}%`);
  logger.info(`  休眠间隔: ${config.minSleepSeconds}-${config.maxSleepSeconds}秒`);
  logger.info('=====================================');
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // 显示启动信息
    displayStartupInfo();
    
    // 设置优雅关闭
    setupGracefulShutdown();
    
    // 检查余额
    const balanceChecker = new BalanceChecker();
    await balanceChecker.checkAllBalances();
    
    // 检查是否有足够余额
    const hasBalance = await balanceChecker.hasEnoughBalance();
    if (!hasBalance) {
      logger.error('❌ 钱包中没有USDT或USDC余额，无法开始交易');
      logger.info('请确保钱包中有足够的代币余额后重新启动程序');
      process.exit(1);
    }
    
    // 创建交易服务
    tradingService = new TradingService();
    
    // 开始自动交易
    await tradingService.startTrading();
    
  } catch (error) {
    logger.error('程序启动失败', error as Error);
    process.exit(1);
  }
}

// 启动程序
if (require.main === module) {
  main().catch((error) => {
    logger.error('程序异常退出', error);
    process.exit(1);
  });
}

export { TradingService }; 