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

    // 获取代币名称
    const coin1Name = await client.getTokenName(config.coin1Address);
    const coin2Name = await client.getTokenName(config.coin2Address);

    // 检查Coin1余额
    logger.info(`\n--- ${coin1Name} 余额检查 ---`);
    logger.info(`${coin1Name}地址: ${config.coin1Address}`);
    const coin1Balance = await client.getTokenBalance(config.coin1Address);
    logger.info(`${coin1Name}余额: ${formatTokenAmount(coin1Balance)} (原始值: ${coin1Balance})`);

    // 检查Coin2余额  
    logger.info(`\n--- ${coin2Name} 余额检查 ---`);
    logger.info(`${coin2Name}地址: ${config.coin2Address}`);
    const coin2Balance = await client.getTokenBalance(config.coin2Address);
    logger.info(`${coin2Name}余额: ${formatTokenAmount(coin2Balance)} (原始值: ${coin2Balance})`);

    logger.info('===================\n');
  } catch (error) {
    logger.error('余额检查失败', error as Error);
  }
} 