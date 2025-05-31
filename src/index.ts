import { TradingService } from './services/tradingService';
import { logger } from './utils/logger';
import { config } from './config';

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
  logger.info('='.repeat(60));
  logger.info('🚀 Hyperion 自动刷量程序');
  logger.info('='.repeat(60));
  logger.info(`网络: ${config.network}`);
  logger.info(`滑点设置: ${config.slippagePercent}%`);
  logger.info(`休眠间隔: ${config.minSleepSeconds}-${config.maxSleepSeconds}秒`);
  logger.info(`代币1地址: ${config.coin1Address}`);
  logger.info(`代币2地址: ${config.coin2Address}`);
  logger.info(`Hyperion路由: ${config.hyperionRouter}`);
  logger.info('='.repeat(60));
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