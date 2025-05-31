import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

export interface Config {
  privateKey: string;
  hyperionRouter: string;
  usdtAddress: string;
  usdcAddress: string;
  slippagePercent: number;
  minSleepSeconds: number;
  maxSleepSeconds: number;
}

function validateConfig(): Config {
  const requiredEnvVars = [
    'PRIVATE_KEY',
    'HYPERION_ROUTER', 
    'USDT_ADDRESS',
    'USDC_ADDRESS'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // 验证私钥格式
  if (!process.env.PRIVATE_KEY!.startsWith('ed25519-priv-')) {
    throw new Error('PRIVATE_KEY must start with "ed25519-priv-"');
  }

  // 验证地址格式 (简单的0x开头检查)
  const addressFields = ['HYPERION_ROUTER', 'USDT_ADDRESS', 'USDC_ADDRESS'];
  for (const field of addressFields) {
    if (!process.env[field]!.startsWith('0x')) {
      throw new Error(`${field} must start with "0x"`);
    }
  }

  return {
    privateKey: process.env.PRIVATE_KEY!,
    hyperionRouter: process.env.HYPERION_ROUTER!,
    usdtAddress: process.env.USDT_ADDRESS!,
    usdcAddress: process.env.USDC_ADDRESS!,
    slippagePercent: parseFloat(process.env.SLIPPAGE_PERCENT || '0.3'),
    minSleepSeconds: parseInt(process.env.MIN_SLEEP_SECONDS || '10'),
    maxSleepSeconds: parseInt(process.env.MAX_SLEEP_SECONDS || '30')
  };
}

export const config = validateConfig(); 