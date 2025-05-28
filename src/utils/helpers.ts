/**
 * 生成指定范围内的随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @returns 随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 异步休眠函数
 * @param seconds 休眠秒数
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * 计算滑点后的最小输出金额
 * @param amount 输入金额
 * @param slippagePercent 滑点百分比 (例如: 0.3 表示 0.3%)
 * @returns 最小输出金额
 */
export function calculateMinAmountOut(amount: bigint, slippagePercent: number): bigint {
  const slippageMultiplier = BigInt(Math.floor((100 - slippagePercent) * 1000000));
  const divisor = BigInt(100 * 1000000);
  return (amount * slippageMultiplier) / divisor;
}

/**
 * 格式化代币金额显示
 * @param amount 金额（最小单位）
 * @param decimals 小数位数
 * @returns 格式化后的字符串
 */
export function formatTokenAmount(amount: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === 0n) {
    return wholePart.toString();
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  return `${wholePart}.${trimmedFractional}`;
}

/**
 * 验证地址格式
 * @param address 地址字符串
 * @returns 是否为有效地址
 */
export function isValidAddress(address: string): boolean {
  // 移除可能的0x前缀
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  
  // 检查是否为64位十六进制字符串
  return /^[0-9a-fA-F]{64}$/.test(cleanAddress);
}

/**
 * 标准化地址格式（确保有0x前缀）
 * @param address 地址字符串
 * @returns 标准化后的地址
 */
export function normalizeAddress(address: string): string {
  const cleanAddress = address.startsWith('0x') ? address.slice(2) : address;
  return `0x${cleanAddress}`;
} 