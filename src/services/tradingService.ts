import { Account, Aptos, AptosConfig, Network, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { AptosClient } from './aptosClient.js';
import { 
  sleep, 
  formatTokenAmount 
} from '../utils/helpers';
import { checkAllBalances } from '../utils/balanceChecker';

export class TradingService {
  private aptos: Aptos;
  private account: Account;
  private aptosClient: AptosClient;
  private isRunning: boolean = false;
  private cycleCount: number = 0;
  private usdtName: string = '';
  private usdcName: string = '';

  constructor() {
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    this.aptos = new Aptos(aptosConfig);
    
    // 创建账户
    const privateKey = new Ed25519PrivateKey(config.privateKey);
    this.account = Account.fromPrivateKey({ privateKey });
    
    // 创建AptosClient实例
    this.aptosClient = new AptosClient();
    
    logger.info(`交易账户地址: ${this.account.accountAddress.toString()}`);
  }

  /**
   * 初始化代币名称
   */
  private async initializeTokenNames(): Promise<void> {
    try {
      this.usdtName = await this.aptosClient.getTokenName(config.usdtAddress);
      this.usdcName = await this.aptosClient.getTokenName(config.usdcAddress);
      logger.info(`代币1: ${this.usdtName} (${config.usdtAddress})`);
      logger.info(`代币2: ${this.usdcName} (${config.usdcAddress})`);
    } catch (error) {
      logger.warn(`获取代币名称失败，将使用地址简称: ${error}`);
      this.usdtName = 'USDT';
      this.usdcName = 'USDC';
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
          const usdtBalance = await this.aptosClient.getTokenBalance(config.usdtAddress);
          const usdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);
          
          if (usdtBalance === 0n && usdcBalance === 0n) {
            logger.error(`钱包中没有${this.usdtName}或${this.usdcName}余额，无法进行交易`);
            logger.info('等待60秒后重新检查...');
            await sleep(60);
            continue;
          }

          // 优先交换余额较多的代币
          if (usdtBalance > 0n) {
            await this.swapUsdtToUsdc(usdtBalance);
            await this.randomSleep();
          }
          
          if (usdcBalance > 0n || usdtBalance > 0n) {
            // 重新获取USDC余额（可能刚刚从USDT换来）
            const currentUsdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);
            if (currentUsdcBalance > 0n) {
              await this.swapUsdcToUsdt(currentUsdcBalance);
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
   * 执行 USDT -> USDC 交易
   */
  async swapUsdtToUsdc(amount: bigint): Promise<boolean> {
    try {
      logger.info(`开始执行 USDT -> USDC 交易，数量: ${amount}`);
      
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.hyperionRouter}::router::swap_exact_input`,
          functionArguments: [
            config.usdtAddress,  // from token
            config.usdcAddress,  // to token  
            amount.toString(),   // amount in
            "0",                 // min amount out (会根据滑点计算)
          ],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (executedTransaction.success) {
        logger.info(`USDT -> USDC 交易成功，交易哈希: ${committedTxn.hash}`);
        return true;
      } else {
        logger.error(`USDT -> USDC 交易失败: ${JSON.stringify(executedTransaction)}`);
        return false;
      }
    } catch (error) {
      logger.error(`USDT -> USDC 交易异常:`, error as Error);
      return false;
    }
  }

  /**
   * 执行 USDC -> USDT 交易
   */
  async swapUsdcToUsdt(amount: bigint): Promise<boolean> {
    try {
      logger.info(`开始执行 USDC -> USDT 交易，数量: ${amount}`);
      
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.hyperionRouter}::router::swap_exact_input`,
          functionArguments: [
            config.usdcAddress,  // from token
            config.usdtAddress,  // to token
            amount.toString(),   // amount in
            "0",                 // min amount out (会根据滑点计算)
          ],
        },
      });

      const committedTxn = await this.aptos.signAndSubmitTransaction({
        signer: this.account,
        transaction,
      });

      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (executedTransaction.success) {
        logger.info(`USDC -> USDT 交易成功，交易哈希: ${committedTxn.hash}`);
        return true;
      } else {
        logger.error(`USDC -> USDT 交易失败: ${JSON.stringify(executedTransaction)}`);
        return false;
      }
    } catch (error) {
      logger.error(`USDC -> USDT 交易异常:`, error as Error);
      return false;
    }
  }

  /**
   * 获取账户地址
   */
  getAccountAddress(): string {
    return this.account.accountAddress.toString();
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
      const usdtBalance = await this.aptosClient.getTokenBalance(config.usdtAddress);
      const usdcBalance = await this.aptosClient.getTokenBalance(config.usdcAddress);

      logger.info('\n=== 当前余额 ===');
      logger.info(`${this.usdtName}: ${formatTokenAmount(usdtBalance)}`);
      logger.info(`${this.usdcName}: ${formatTokenAmount(usdcBalance)}`);
      logger.info(`钱包地址: ${this.getAccountAddress()}`);
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