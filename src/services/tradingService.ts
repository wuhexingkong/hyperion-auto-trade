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
  private coin1Name: string = '';
  private coin2Name: string = '';

  constructor() {
    this.aptosClient = new AptosClient();
  }

  /**
   * 初始化代币名称
   */
  private async initializeTokenNames(): Promise<void> {
    try {
      this.coin1Name = await this.aptosClient.getTokenName(config.coin1Address);
      this.coin2Name = await this.aptosClient.getTokenName(config.coin2Address);
      logger.info(`代币1: ${this.coin1Name} (${config.coin1Address})`);
      logger.info(`代币2: ${this.coin2Name} (${config.coin2Address})`);
    } catch (error) {
      logger.warn(`获取代币名称失败，将使用地址简称: ${error}`);
      this.coin1Name = 'Coin1';
      this.coin2Name = 'Coin2';
    }
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
      // 初始化代币名称
      await this.initializeTokenNames();
      
      // 详细余额检查
      await checkAllBalances();

      while (this.isRunning) {
        this.cycleCount++;
        logger.info(`\n=== 开始第 ${this.cycleCount} 轮交易 ===`);

        try {
          // 检查是否有任何代币余额
          const coin1Balance = await this.aptosClient.getTokenBalance(config.coin1Address);
          const coin2Balance = await this.aptosClient.getTokenBalance(config.coin2Address);
          
          if (coin1Balance === 0n && coin2Balance === 0n) {
            logger.error(`钱包中没有${this.coin1Name}或${this.coin2Name}余额，无法进行交易`);
            logger.info('等待60秒后重新检查...');
            await sleep(60);
            continue;
          }

          // 优先交换余额较多的代币
          if (coin1Balance > 0n) {
            await this.swapCoin1ToCoin2();
            await this.randomSleep();
          }
          
          if (coin2Balance > 0n || coin1Balance > 0n) {
            // 重新获取Coin2余额（可能刚刚从Coin1换来）
            const currentCoin2Balance = await this.aptosClient.getTokenBalance(config.coin2Address);
            if (currentCoin2Balance > 0n) {
              await this.swapCoin2ToCoin1();
              await this.randomSleep();
            }
          }

          logger.info(`第 ${this.cycleCount} 轮交易完成`);

        } catch (error) {
          logger.error(`第 ${this.cycleCount} 轮交易失败`, error as Error);
          logger.info('等待30秒后继续下一轮...');
          await sleep(30);
        }
      }
    } catch (error) {
      logger.error('交易服务启动失败', error as Error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * 停止交易
   */
  stopTrading(): void {
    logger.info('正在停止交易...');
    this.isRunning = false;
  }

  /**
   * Coin1 -> Coin2 交换
   */
  private async swapCoin1ToCoin2(): Promise<void> {
    logger.info(`执行 ${this.coin1Name} -> ${this.coin2Name} 交换`);

    // 获取Coin1余额
    const coin1Balance = await this.aptosClient.getTokenBalance(config.coin1Address);
    
    if (coin1Balance === 0n) {
      throw new Error(`${this.coin1Name}余额为0，无法执行交换`);
    }

    logger.info(`${this.coin1Name}余额: ${formatTokenAmount(coin1Balance)} ${this.coin1Name}`);

    // 计算最小输出金额（考虑滑点）
    const minAmountOut = this.calculateMinAmountOut(coin1Balance);
    
    logger.info(`预期最小输出: ${formatTokenAmount(minAmountOut)} ${this.coin2Name}`);

    // 执行交换
    const txHash = await this.aptosClient.executeSwap(
      config.coin1Address,
      config.coin2Address,
      coin1Balance,
      minAmountOut
    );

    logger.info(`${this.coin1Name} -> ${this.coin2Name} 交换完成，交易哈希: ${txHash}`);
  }

  /**
   * Coin2 -> Coin1 交换
   */
  private async swapCoin2ToCoin1(): Promise<void> {
    logger.info(`执行 ${this.coin2Name} -> ${this.coin1Name} 交换`);

    // 获取Coin2余额
    const coin2Balance = await this.aptosClient.getTokenBalance(config.coin2Address);
    
    if (coin2Balance === 0n) {
      throw new Error(`${this.coin2Name}余额为0，无法执行交换`);
    }

    logger.info(`${this.coin2Name}余额: ${formatTokenAmount(coin2Balance)} ${this.coin2Name}`);

    // 计算最小输出金额（考虑滑点）
    const minAmountOut = this.calculateMinAmountOut(coin2Balance);
    
    logger.info(`预期最小输出: ${formatTokenAmount(minAmountOut)} ${this.coin1Name}`);

    // 执行交换
    const txHash = await this.aptosClient.executeSwap(
      config.coin2Address,
      config.coin1Address,
      coin2Balance,
      minAmountOut
    );

    logger.info(`${this.coin2Name} -> ${this.coin1Name} 交换完成，交易哈希: ${txHash}`);
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
   */
  private async randomSleep(): Promise<void> {
    const sleepTime = Math.floor(
      Math.random() * (config.maxSleepSeconds - config.minSleepSeconds + 1) + config.minSleepSeconds
    );
    logger.info(`休眠 ${sleepTime} 秒...`);
    await sleep(sleepTime);
  }

  /**
   * 显示当前余额
   */
  private async displayBalances(): Promise<void> {
    try {
      const coin1Balance = await this.aptosClient.getTokenBalance(config.coin1Address);
      const coin2Balance = await this.aptosClient.getTokenBalance(config.coin2Address);

      logger.info('\n=== 当前余额 ===');
      logger.info(`${this.coin1Name}: ${formatTokenAmount(coin1Balance)}`);
      logger.info(`${this.coin2Name}: ${formatTokenAmount(coin2Balance)}`);
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