import { 
  Aptos, 
  AptosConfig, 
  Account, 
  Ed25519PrivateKey,
  AccountAddress,
  InputEntryFunctionData,
  Network
} from '@aptos-labs/ts-sdk';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { normalizeAddress } from '../utils/helpers.js';

export class AptosClient {
  private aptos: Aptos;
  private account: Account;
  private tokenNameCache: Map<string, string> = new Map();

  constructor() {
    // 初始化Aptos配置 - 使用主网
    const aptosConfig = new AptosConfig({ 
      network: Network.MAINNET 
    });
    
    this.aptos = new Aptos(aptosConfig);
    
    // 从私钥创建账户
    const privateKey = new Ed25519PrivateKey(config.privateKey);
    this.account = Account.fromPrivateKey({ privateKey });
    
    logger.info(`初始化Aptos客户端，网络: MAINNET`);
    logger.info(`钱包地址: ${this.account.accountAddress.toString()}`);
  }

  /**
   * 获取账户地址
   */
  getAccountAddress(): string {
    return this.account.accountAddress.toString();
  }

  /**
   * 获取代币名称
   * @param tokenAddress 代币合约地址
   * @returns 代币名称或符号
   */
  async getTokenName(tokenAddress: string): Promise<string> {
    const normalizedAddress = normalizeAddress(tokenAddress);
    
    // 检查缓存
    if (this.tokenNameCache.has(normalizedAddress)) {
      return this.tokenNameCache.get(normalizedAddress)!;
    }

    try {
      // 尝试获取 Fungible Asset 元数据
      try {
        const faMetadata = await this.aptos.getFungibleAssetMetadataByAssetType({
          assetType: normalizedAddress
        });
        
        if (faMetadata && faMetadata.symbol) {
          this.tokenNameCache.set(normalizedAddress, faMetadata.symbol);
          return faMetadata.symbol;
        }
      } catch (faError) {
        logger.debug(`FA元数据查询失败: ${faError}`);
      }

      // 尝试获取传统 Coin 信息
      try {
        const coinInfo = await this.aptos.getAccountResource({
          accountAddress: normalizedAddress,
          resourceType: `0x1::coin::CoinInfo<${normalizedAddress}>`
        });

        const symbol = (coinInfo as any).symbol;
        if (symbol) {
          this.tokenNameCache.set(normalizedAddress, symbol);
          return symbol;
        }
      } catch (coinError) {
        logger.debug(`Coin信息查询失败: ${coinError}`);
      }

      // 如果都失败了，返回地址的简短形式
      const shortAddress = `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
      this.tokenNameCache.set(normalizedAddress, shortAddress);
      return shortAddress;
    } catch (error) {
      logger.debug(`获取代币名称失败: ${error}`);
      const shortAddress = `${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
      this.tokenNameCache.set(normalizedAddress, shortAddress);
      return shortAddress;
    }
  }

  /**
   * 获取代币余额
   * @param tokenAddress 代币合约地址
   * @returns 代币余额
   */
  async getTokenBalance(tokenAddress: string): Promise<bigint> {
    try {
      const normalizedAddress = normalizeAddress(tokenAddress);
      
      // 首先尝试获取 Fungible Asset 余额
      try {
        const faBalance = await this.aptos.getCurrentFungibleAssetBalances({
          options: {
            where: {
              owner_address: { _eq: this.account.accountAddress.toString() },
              asset_type: { _eq: normalizedAddress }
            }
          }
        });

        if (faBalance && faBalance.length > 0) {
          return BigInt(faBalance[0].amount);
        }
      } catch (faError) {
        logger.debug(`FA余额查询失败: ${faError}`);
      }

      // 如果FA查询失败，尝试传统的Coin查询
      try {
        const resource = await this.aptos.getAccountResource({
          accountAddress: this.account.accountAddress,
          resourceType: `0x1::coin::CoinStore<${normalizedAddress}>`
        });

        const balance = (resource as any).coin.value;
        return BigInt(balance);
      } catch (coinError) {
        logger.debug(`Coin余额查询失败: ${coinError}`);
      }

      // 如果都失败了，返回0
      return 0n;
    } catch (error) {
      logger.debug(`获取代币余额失败: ${error}`);
      return 0n;
    }
  }

  /**
   * 构建交易载荷
   * @param functionName 函数名
   * @param typeArguments 类型参数
   * @param functionArguments 函数参数
   * @returns 交易载荷
   */
  private buildTransactionPayload(
    functionName: string,
    typeArguments: string[] = [],
    functionArguments: any[] = []
  ): InputEntryFunctionData {
    return {
      function: functionName as `${string}::${string}::${string}`,
      typeArguments,
      functionArguments
    };
  }

  /**
   * 执行Hyperion交换交易
   * @param fromToken 源代币地址
   * @param toToken 目标代币地址
   * @param amountIn 输入金额
   * @param minAmountOut 最小输出金额
   * @returns 交易哈希
   */
  async executeSwap(
    fromToken: string,
    toToken: string,
    amountIn: bigint,
    minAmountOut: bigint
  ): Promise<string> {
    try {
      // 获取代币名称用于日志
      const fromTokenName = await this.getTokenName(fromToken);
      const toTokenName = await this.getTokenName(toToken);
      
      logger.info(`准备执行交换: ${amountIn} ${fromTokenName} -> ${toTokenName}`);
      
      // 直接构建交易 - 避免类型转换问题
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.account.accountAddress,
        data: {
          function: `${config.hyperionRouter}::router_v3::swap_batch` as `${string}::${string}::${string}`,
          functionArguments: [
            // pool_id_list - 字符串数组
            [normalizeAddress("0xd3894aca06d5f42b27c89e6f448114b3ed6a1ba07f992a58b2126c71dd83c127")],
            // from_token - 使用AccountAddress类型
            AccountAddress.fromString(normalizeAddress(fromToken)),
            // to_token - 使用AccountAddress类型
            AccountAddress.fromString(normalizeAddress(toToken)),
            // amount_in - 字符串
            amountIn.toString(),
            // min_amount_out - 字符串
            minAmountOut.toString(),
            // referrer - 地址字符串
            normalizeAddress("0x910aeaa9a8effcf80bb7dbad0f209f25f5469cb04c1ee3c68161e070d3c6ccf6")
          ]
        }
      });

      // 模拟交易（可选）
      logger.debug('模拟交易...');
      const [simulationResult] = await this.aptos.transaction.simulate.simple({
        signerPublicKey: this.account.publicKey,
        transaction
      });

      if (!simulationResult.success) {
        throw new Error(`交易模拟失败: ${simulationResult.vm_status}`);
      }

      // 签名交易
      const senderAuthenticator = this.aptos.transaction.sign({
        signer: this.account,
        transaction
      });

      // 提交交易
      const submittedTransaction = await this.aptos.transaction.submit.simple({
        transaction,
        senderAuthenticator
      });

      logger.info(`交易已提交: ${submittedTransaction.hash}`);

      // 等待交易确认 - 增加超时时间到60秒
      const executedTransaction = await this.aptos.waitForTransaction({
        transactionHash: submittedTransaction.hash,
        options: {
          timeoutSecs: 60, // 增加到60秒
          checkSuccess: true
        }
      });

      if (executedTransaction.success) {
        logger.info(`${fromTokenName} -> ${toTokenName} 交换完成，交易哈希: ${submittedTransaction.hash}`);
        return submittedTransaction.hash;
      } else {
        throw new Error(`交易执行失败: ${executedTransaction.vm_status}`);
      }

    } catch (error) {
      logger.error('交易执行失败', error as Error);
      throw error;
    }
  }

  /**
   * 获取账户信息
   */
  async getAccountInfo() {
    try {
      const accountInfo = await this.aptos.getAccountInfo({
        accountAddress: this.account.accountAddress
      });
      return accountInfo;
    } catch (error) {
      logger.error('获取账户信息失败', error as Error);
      throw error;
    }
  }
} 