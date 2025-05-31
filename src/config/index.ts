import dotenv from 'dotenv';
import { Network, PrivateKey, PrivateKeyVariants } from '@aptos-labs/ts-sdk';

// 加载环境变量
dotenv.config();

export interface Config {
  // 网络配置
  network: Network;
  
  // 钱包配置
  privateKey: string;
  
  // 合约地址
  hyperionRouter: string;
  usdtAddress: string;
  usdcAddress: string;
  
  // 交易配置
  slippagePercent: number;
  minSleepSeconds: number;
  maxSleepSeconds: number;
  
  // 日志配置
  logLevel: string;
}

function validatePrivateKey(key: string): string {
  // 检查是否为AIP-80标准格式
  if (!key.startsWith('ed25519-priv-')) {
    throw new Error('私钥必须使用AIP-80标准格式，例如: ed25519-priv-0x1234...');
  }
  
  // 使用AIP-80标准格式化私钥（验证格式是否正确）
  try {
    const formattedKey = PrivateKey.formatPrivateKey(key, PrivateKeyVariants.Ed25519);
    return formattedKey;
  } catch (error) {
    throw new Error(`私钥格式无效，请使用AIP-80标准格式: ${error}`);
  }
}

function getNetworkFromString(networkStr: string): Network {
  switch (networkStr.toLowerCase()) {
    case 'mainnet':
      return Network.MAINNET;
    case 'testnet':
      return Network.TESTNET;
    case 'devnet':
      return Network.DEVNET;
    default:
      throw new Error(`不支持的网络类型: ${networkStr}`);
  }
}

function validateAndLoadConfig(): Config {
  // 检查必需的环境变量
  const requiredEnvVars = [
    'PRIVATE_KEY',
    'APTOS_NETWORK',
    'HYPERION_ROUTER',
    'USDT_ADDRESS',
    'USDC_ADDRESS'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`缺少必需的环境变量: ${envVar}`);
    }
  }

  // 验证休眠间隔配置
  const minSleep = parseInt(process.env.MIN_SLEEP_SECONDS || '10');
  const maxSleep = parseInt(process.env.MAX_SLEEP_SECONDS || '30');
  
  if (isNaN(minSleep) || isNaN(maxSleep)) {
    throw new Error('MIN_SLEEP_SECONDS和MAX_SLEEP_SECONDS必须是有效的数字');
  }
  
  if (maxSleep <= minSleep) {
    throw new Error(`MAX_SLEEP_SECONDS (${maxSleep}) 必须大于 MIN_SLEEP_SECONDS (${minSleep})`);
  }
  
  if (minSleep < 1) {
    throw new Error('MIN_SLEEP_SECONDS必须大于等于1秒');
  }

  return {
    network: getNetworkFromString(process.env.APTOS_NETWORK!),
    privateKey: validatePrivateKey(process.env.PRIVATE_KEY!),
    hyperionRouter: process.env.HYPERION_ROUTER!,
    usdtAddress: process.env.USDT_ADDRESS!,
    usdcAddress: process.env.USDC_ADDRESS!,
    slippagePercent: parseFloat(process.env.SLIPPAGE_PERCENT || '0.3'),
    minSleepSeconds: minSleep,
    maxSleepSeconds: maxSleep,
    logLevel: process.env.LOG_LEVEL || 'info'
  };
}

export const config = validateAndLoadConfig(); 