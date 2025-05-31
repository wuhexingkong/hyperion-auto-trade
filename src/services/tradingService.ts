import { AptosClient } from './aptosClient';
import { config } from '../config';
import { logger } from '../utils/logger';
import { 
  sleep, 
  formatTokenAmount 
} from '../utils/helpers';
import { checkAllBalances } from '../utils/balanceChecker';

export class TradingService {
  private aptosClient: AptosClient;
  private isRunning: boolean = false;
  private cycleCount: number = 0;

  constructor() {
    this.aptosClient = new AptosClient();
  }

  /**
   * 开始自动交易
   */
  async startTrading(): Promise<void> {
    if (this.isRunning) {
      logger.warn('交易已在运行中');
      return;
    }

    this.isRunning = true;
    logger.info('开始自动刷量交易...');
    logger.info(`滑点设置: ${config.slippagePercent}%`);
    logger.info(`休眠间隔: ${config.minSleepSeconds}-${config.maxSleepSeconds}秒`);

    try {
      // 详细余额检查
      await checkAllBalances();

      while (this.isRunning) {
        this.cycleCount++;
        logger.info(`\n=== 开始第 ${this.cycleCount} 轮交易 ===`);

        try {
          // 检查是否有任何代币余额
          const usdtBalance = await this.aptosClient.getTokenBalance(config.usdtAddress);
          const usdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);
          
          if (usdtBalance === 0n && usdcBalance === 0n) {
            logger.error('钱包中没有USDT或USDC余额，无法进行交易');
            logger.info('等待60秒后重新检查...');
            await sleep(60);
            continue;
          }

          // 优先交换余额较多的代币
          if (usdtBalance > 0n) {
            await this.swapUsdtToUsdc();
            await this.randomSleep();
          }
          
          if (usdcBalance > 0n || usdtBalance > 0n) {
            // 重新获取USDC余额（可能刚刚从USDT换来）
            const currentUsdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);
            if (currentUsdcBalance > 0n) {
              await this.swapUsdcToUsdt();
              await this.randomSleep();
            }
          }

          logger.info(`第 ${this.cycleCount} 轮交易完成`);

        } catch (error) {
          logger.error(`第 ${this.cycleCount} 轮交易失败`, error as Error);
          
          // 交易失败时等待更长时间再重试
          logger.info('等待30秒后重试...');
          await sleep(30);
        }
      }
    } catch (error) {
      logger.error('交易服务异常', error as Error);
    } finally {
      this.isRunning = false;
      logger.info('自动交易已停止');
    }
  }

  /**
   * 停止自动交易
   */
  stopTrading(): void {
    if (this.isRunning) {
      logger.info('正在停止自动交易...');
      this.isRunning = false;
    }
  }

  /**
   * USDT -> USDC 交换
   */
  private async swapUsdtToUsdc(): Promise<void> {
    logger.info('执行 USDT -> USDC 交换');

    // 获取USDT余额
    const usdtBalance = await this.aptosClient.getTokenBalance(config.usdtAddress);
    
    if (usdtBalance === 0n) {
      throw new Error('USDT余额为0，无法执行交换');
    }

    logger.info(`USDT余额: ${formatTokenAmount(usdtBalance)} USDT`);

    // 计算最小输出金额（考虑滑点）
    const minAmountOut = this.calculateMinAmountOut(usdtBalance);
    
    logger.info(`预期最小输出: ${formatTokenAmount(minAmountOut)} USDC`);

    // 执行交换
    const txHash = await this.aptosClient.executeSwap(
      config.usdtAddress,
      config.usdcAddress,
      usdtBalance,
      minAmountOut
    );

    logger.info(`USDT -> USDC 交换完成，交易哈希: ${txHash}`);
  }

  /**
   * USDC -> USDT 交换
   */
  private async swapUsdcToUsdt(): Promise<void> {
    logger.info('执行 USDC -> USDT 交换');

    // 获取USDC余额
    const usdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);
    
    if (usdcBalance === 0n) {
      throw new Error('USDC余额为0，无法执行交换');
    }

    logger.info(`USDC余额: ${formatTokenAmount(usdcBalance)} USDC`);

    // 计算最小输出金额（考虑滑点）
    const minAmountOut = this.calculateMinAmountOut(usdcBalance);
    
    logger.info(`预期最小输出: ${formatTokenAmount(minAmountOut)} USDT`);

    // 执行交换
    const txHash = await this.aptosClient.executeSwap(
      config.usdcAddress,
      config.usdtAddress,
      usdcBalance,
      minAmountOut
    );

    logger.info(`USDC -> USDT 交换完成，交易哈希: ${txHash}`);
  }

  /**
   * 计算最小输出金额（考虑滑点）
   * @param amountIn 输入金额
   * @returns 最小输出金额
   */
  private calculateMinAmountOut(amountIn: bigint): bigint {
    const slippageMultiplier = (100 - config.slippagePercent) / 100;
    return BigInt(Math.floor(Number(amountIn) * slippageMultiplier));
  }

  /**
   * 随机休眠
   * @param minSeconds 最小秒数
   * @param maxSeconds 最大秒数
   */
  private async randomSleep(minSeconds?: number, maxSeconds?: number): Promise<void> {
    const min = minSeconds || config.minSleepSeconds;
    const max = maxSeconds || config.maxSleepSeconds;
    const sleepTime = Math.floor(Math.random() * (max - min + 1)) + min;
    
    logger.info(`休眠 ${sleepTime} 秒...`);
    await new Promise(resolve => setTimeout(resolve, sleepTime * 1000));
  }

  /**
   * 显示当前余额
   */
  private async displayBalances(): Promise<void> {
    try {
      const usdtBalance = await this.aptosClient.getTokenBalance(config.usdtAddress);
      const usdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);

      logger.info('\n=== 当前余额 ===');
      logger.info(`USDT: ${formatTokenAmount(usdtBalance)}`);
      logger.info(`USDC: ${formatTokenAmount(usdcBalance)}`);
      logger.info(`钱包地址: ${this.aptosClient.getAccountAddress()}`);
      logger.info('================\n');
    } catch (error) {
      logger.error('获取余额失败', error as Error);
    }
  }

  /**
   * 获取交易统计信息
   */
  getStats(): { cycleCount: number; isRunning: boolean } {
    return {
      cycleCount: this.cycleCount,
      isRunning: this.isRunning
    };
  }
} 