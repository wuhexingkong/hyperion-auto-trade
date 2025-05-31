import { config } from '../config/index.js';
import { logger } from './logger.js';
import { AptosClient } from '../services/aptosClient.js';

export class BalanceChecker {
  private aptosClient: AptosClient;

  constructor() {
    this.aptosClient = new AptosClient();
  }

  /**
   * 检查所有代币余额
   */
  async checkAllBalances(): Promise<void> {
    try {
      logger.info('=== 余额检查 ===');
      
      const usdtBalance = await this.aptosClient.getTokenBalance(config.usdtAddress);
      const usdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);
      
      // 获取代币名称
      const usdtName = await this.aptosClient.getTokenName(config.usdtAddress);
      const usdcName = await this.aptosClient.getTokenName(config.usdcAddress);
      
      logger.info(`${usdtName} 余额: ${this.formatBalance(usdtBalance)}`);
      logger.info(`${usdcName} 余额: ${this.formatBalance(usdcBalance)}`);
      
      // 检查是否有足够余额进行交易
      if (usdtBalance === 0n && usdcBalance === 0n) {
        logger.warn('⚠️  所有代币余额为0，无法进行交易');
      } else {
        logger.info('✅ 有可用余额，可以进行交易');
      }
      
      logger.info('================');
    } catch (error) {
      logger.error('余额检查失败:', error as Error);
    }
  }

  /**
   * 检查USDT余额
   */
  async checkUsdtBalance(): Promise<bigint> {
    try {
      return await this.aptosClient.getTokenBalance(config.usdtAddress);
    } catch (error) {
      logger.error('获取USDT余额失败:', error as Error);
      return 0n;
    }
  }

  /**
   * 检查USDC余额
   */
  async checkUsdcBalance(): Promise<bigint> {
    try {
      return await this.aptosClient.getTokenBalance(config.usdcAddress);
    } catch (error) {
      logger.error('获取USDC余额失败:', error as Error);
      return 0n;
    }
  }

  /**
   * 格式化余额显示
   */
  private formatBalance(balance: bigint): string {
    // 假设代币精度为6位小数（USDT/USDC通常是6位）
    const decimals = 6;
    const divisor = BigInt(10 ** decimals);
    const integerPart = balance / divisor;
    const fractionalPart = balance % divisor;
    
    // 格式化小数部分，去除尾随零
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0').replace(/0+$/, '');
    
    if (fractionalStr === '') {
      return integerPart.toString();
    } else {
      return `${integerPart}.${fractionalStr}`;
    }
  }

  /**
   * 检查是否有足够余额进行交易
   */
  async hasEnoughBalance(): Promise<boolean> {
    try {
      const usdtBalance = await this.checkUsdtBalance();
      const usdcBalance = await this.checkUsdcBalance();
      
      return usdtBalance > 0n || usdcBalance > 0n;
    } catch (error) {
      logger.error('检查余额时发生错误:', error as Error);
      return false;
    }
  }
} 