import { AptosClient } from '../services/aptosClient';
import { config } from '../config';
import { logger } from './logger';
import { formatTokenAmount } from './helpers';

export async function checkAllBalances(): Promise<void> {
  try {
    const client = new AptosClient();
    const accountAddress = client.getAccountAddress();
    
    logger.info('=== 详细余额检查 ===');
    logger.info(`钱包地址: ${accountAddress}`);
    
    // 检查账户信息
    try {
      const accountInfo = await client.getAccountInfo();
      logger.info(`账户序列号: ${accountInfo.sequence_number}`);
    } catch (error) {
      logger.error('获取账户信息失败', error as Error);
    }

    // 检查USDT余额
    logger.info('\n--- USDT 余额检查 ---');
    logger.info(`USDT地址: ${config.usdtAddress}`);
    const usdtBalance = await client.getTokenBalance(config.usdtAddress);
    logger.info(`USDT余额: ${formatTokenAmount(usdtBalance)} (原始值: ${usdtBalance})`);

    // 检查USDC余额  
    logger.info('\n--- USDC 余额检查 ---');
    logger.info(`USDC地址: ${config.usdcAddress}`);
    const usdcBalance = await client.getTokenBalance(config.usdcAddress);
    logger.info(`USDC余额: ${formatTokenAmount(usdcBalance)} (原始值: ${usdcBalance})`);

    logger.info('===================\n');
  } catch (error) {
    logger.error('余额检查失败', error as Error);
  }
} 