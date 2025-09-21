import { createPublicClient, createWalletClient, custom, http, type Address, formatUnits, parseUnits } from 'viem'
import { mainnet } from 'viem/chains'
import { blueAbi } from '@morpho-org/blue-sdk-viem'

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: any
  }
}

// Use mainnet for Morpho Blue

// Mainnet contract addresses for Morpho Blue
const MORPHO_BLUE = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address
const WSTETH = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as Address // mainnet wstETH
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address // mainnet USDC
const ADAPTIVE_IRM = '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC' as Address
const CHAINLINK_ETH_USD = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419' as Address // Chainlink ETH/USD feed on mainnet

// Use mainnet configuration with RPC from environment
const CHAIN = mainnet
const RPC_URL = process.env.NEXT_PUBLIC_ETHEREUM_RPC!

// ERC20 ABI for token operations
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Use the complete Morpho Blue ABI from SDK directly

export interface MorphoMarketData {
  marketId: string
  lltv: number
  supplyAPY: number
  borrowAPY: number
  totalSupply: string
  totalBorrow: string
  oraclePrice: number
  ethPrice: number // ETH price in USD
}

export interface UserPositionData {
  collateralBalance: number
  borrowedBalance: number
  healthFactor: number
  ltv: number
  liquidationThreshold: number
  maxBorrowable: number
  availableToBorrow: number
}

export class MorphoBlueClient {
  private publicClient: any
  private marketId: string | null = null
  private oracleAddress: Address | null = null
  private cachedEthPrice: number | null = null
  private ethPriceLastFetch: number = 0
  
  constructor() {
    this.publicClient = createPublicClient({
      chain: CHAIN,
      transport: http(RPC_URL)
    })
    
    // Use mainnet market ID for wstETH/USDC
    // Market: https://app.morpho.org/ethereum/market/0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc
    this.marketId = '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc'
    this.oracleAddress = '0x0000000000000000000000000000000000000000' as Address
  }
  
  
  /**
   * Get market parameters for our wstETH/USDC market
   */
  private getMarketParams(): any {
    // Market parameters fetched from contract for market ID: 0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc
    // Verified via: cast call 0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb "idToMarketParams(bytes32)"
    const oracle = '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2' as Address
    
    // Return just the 5 parameters that supplyCollateral expects
    return {
      loanToken: USDC,
      collateralToken: WSTETH,
      oracle: oracle,
      irm: ADAPTIVE_IRM,
      lltv: BigInt(860000000000000000) // 86% LLTV (0.86 * 10^18) - removed string literal
    }
  }
  
  /**
   * Fetch market data
   */
  async getMarketData(): Promise<MorphoMarketData | null> {
    try {
      // Get oracle price and ETH price
      const [oraclePrice, ethPrice] = await Promise.all([
        this.getOraclePrice(),
        this.getEthPrice()
      ])
      
      // Return market data with ETH price
      return {
        marketId: this.marketId || '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
        lltv: 86, // 86% as configured
        supplyAPY: 3.5, // Estimate
        borrowAPY: 5.2, // Estimate
        totalSupply: '0',
        totalBorrow: '0',
        oraclePrice,
        ethPrice
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
      // Return default data so UI still shows
      return {
        marketId: this.marketId || '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
        lltv: 86,
        supplyAPY: 3.5,
        borrowAPY: 5.2,
        totalSupply: '0',
        totalBorrow: '0',
        oraclePrice: 1.15,
        ethPrice: 4500
      }
    }
  }
  
  /**
   * Get user position in the market
   */
  async getUserPosition(userAddress: Address): Promise<UserPositionData | null> {
    try {
      if (!this.marketId) {
        return null
      }
      
      // Read position and market data from contract
      const [position, marketData] = await Promise.all([
        this.publicClient.readContract({
          address: MORPHO_BLUE,
          abi: [{
            inputs: [
              { name: 'id', type: 'bytes32' },
              { name: 'user', type: 'address' }
            ],
            name: 'position',
            outputs: [
              { name: 'supplyShares', type: 'uint256' },
              { name: 'borrowShares', type: 'uint256' },
              { name: 'collateral', type: 'uint256' }
            ],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'position',
          args: [this.marketId as `0x${string}`, userAddress]
        }),
        this.publicClient.readContract({
          address: MORPHO_BLUE,
          abi: [{
            inputs: [{ name: 'id', type: 'bytes32' }],
            name: 'market',
            outputs: [
              { name: 'totalSupplyAssets', type: 'uint128' },
              { name: 'totalSupplyShares', type: 'uint128' },
              { name: 'totalBorrowAssets', type: 'uint128' },
              { name: 'totalBorrowShares', type: 'uint128' },
              { name: 'lastUpdate', type: 'uint128' },
              { name: 'fee', type: 'uint128' }
            ],
            stateMutability: 'view',
            type: 'function'
          }],
          functionName: 'market',
          args: [this.marketId as `0x${string}`]
        })
      ])
      
      if (!position || !position[2]) {
        return {
          collateralBalance: 0,
          borrowedBalance: 0,
          healthFactor: 0,
          ltv: 0,
          liquidationThreshold: 86,
          maxBorrowable: 0,
          availableToBorrow: 0
        }
      }
      
      // Convert from wei to human readable
      // position returns [supplyShares, borrowShares, collateral]
      const collateralBalance = Number(formatUnits(position[2] || BigInt(0), 18))
      
      // Convert borrow shares to assets
      // If there are total shares, calculate the user's portion of total assets
      let borrowedBalance = 0
      if (marketData && marketData[3] > BigInt(0) && position[1] > BigInt(0)) {
        // borrowedAssets = (userBorrowShares * totalBorrowAssets) / totalBorrowShares
        const borrowedAssets = (position[1] * marketData[2]) / marketData[3]
        borrowedBalance = Number(formatUnits(borrowedAssets, 6)) // USDC has 6 decimals
      }
      
      // Get oracle price and ETH price for USD conversion
      const oraclePrice = await this.getOraclePrice() // wstETH to ETH
      const ethPrice = await this.getEthPrice() // ETH to USD
      
      // Calculate health metrics
      const collateralValueETH = collateralBalance * oraclePrice
      const collateralValueUSD = collateralValueETH * ethPrice
      const maxBorrowableUSD = collateralValueUSD * 0.86 // 86% LLTV in USD
      const availableToBorrow = Math.max(0, maxBorrowableUSD - borrowedBalance) // borrowedBalance is already in USDC
      const currentLTV = collateralValueUSD > 0 ? (borrowedBalance / collateralValueUSD) * 100 : 0
      // Health factor: if no borrows, return max value (infinite health). If borrowed, calculate ratio
      const healthFactor = borrowedBalance > 0 ? (maxBorrowableUSD / borrowedBalance) : 999
      
      return {
        collateralBalance,
        borrowedBalance,
        healthFactor,
        ltv: currentLTV,
        liquidationThreshold: 86,
        maxBorrowable: maxBorrowableUSD,
        availableToBorrow
      }
    } catch (error) {
      console.error('Error fetching user position:', error)
      return null
    }
  }
  
  /**
   * Supply wstETH as collateral with wallet client
   */
  async supplyCollateralWithClient(amount: string, userAddress: Address, walletClient: any): Promise<string> {
    // Ensure we're on mainnet (chain ID 1)
    if (walletClient.chain?.id !== 1) {
      throw new Error('Please switch to Ethereum Mainnet in your wallet')
    }
    
    const marketParams = this.getMarketParams()
    const amountWei = parseUnits(amount, 18)
    
    console.log('Supply collateral params:', {
      marketParams,
      amount,
      amountWei: amountWei.toString(),
      userAddress,
      chainId: walletClient.chain?.id,
      marketId: this.marketId
    })
    
    // Log the exact market params being used
    console.log('Market params detail:', {
      loanToken: marketParams.loanToken,
      collateralToken: marketParams.collateralToken,
      oracle: marketParams.oracle,
      irm: marketParams.irm,
      lltv: marketParams.lltv.toString()
    })
    
    // Check balance first
    const balance = await this.publicClient.readContract({
      address: WSTETH,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    })
    
    if (balance < amountWei) {
      throw new Error(`Insufficient wstETH balance. Have: ${formatUnits(balance, 18)}, Need: ${amount}`)
    }
    
    // First approve Morpho to spend wstETH
    console.log('Approving wstETH...')
    const approveTx = await walletClient.writeContract({
      address: WSTETH,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [MORPHO_BLUE, amountWei]
    })
    
    await this.publicClient.waitForTransactionReceipt({ hash: approveTx })
    console.log('Approval confirmed:', approveTx)
    
    // Supply collateral - this requires prior approval
    console.log('Supplying collateral...')
    const supplyTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'supplyCollateral',
      args: [
        marketParams,
        amountWei, // assets amount
        userAddress, // onBehalf
        '0x' // empty bytes for data parameter
      ],
      gas: BigInt(300000) // Add explicit gas limit
    })
    
    console.log('Supply transaction sent:', supplyTx)
    return supplyTx
  }

  /**
   * Supply wstETH as collateral
   */
  async supplyCollateral(amount: string, userAddress: Address): Promise<string> {
    if (!window.ethereum) throw new Error('No wallet connected')
    
    const walletClient = createWalletClient({
      chain: CHAIN,
      transport: custom(window.ethereum)
    })
    
    const marketParams = this.getMarketParams()
    const amountWei = parseUnits(amount, 18)
    
    console.log('Supply collateral params:', {
      marketParams,
      amount,
      amountWei: amountWei.toString(),
      userAddress
    })
    
    // Check balance first
    const balance = await this.publicClient.readContract({
      address: WSTETH,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    })
    
    if (balance < amountWei) {
      throw new Error(`Insufficient wstETH balance. Have: ${formatUnits(balance, 18)}, Need: ${amount}`)
    }
    
    // First approve Morpho to spend wstETH
    console.log('Approving wstETH...')
    const approveTx = await walletClient.writeContract({
      address: WSTETH,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [MORPHO_BLUE, amountWei],
      account: userAddress
    })
    
    await this.publicClient.waitForTransactionReceipt({ hash: approveTx })
    console.log('Approval confirmed:', approveTx)
    
    // Supply collateral
    console.log('Supplying collateral...')
    const supplyTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'supplyCollateral',
      args: [
        marketParams,
        amountWei, // assets amount
        userAddress, // onBehalf
        '0x' // empty bytes for data parameter
      ],
      account: userAddress
    })
    
    console.log('Supply transaction sent:', supplyTx)
    return supplyTx
  }
  
  /**
   * Borrow USDC against collateral with wallet client
   */
  async borrowAssetWithClient(amount: string, userAddress: Address, walletClient: any): Promise<string> {
    // Ensure we're on mainnet (chain ID 1)
    if (walletClient.chain?.id !== 1) {
      throw new Error('Please switch to Ethereum Mainnet in your wallet')
    }
    
    const marketParams = this.getMarketParams()
    const amountWei = parseUnits(amount, 6) // USDC has 6 decimals
    
    const borrowTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'borrow',
      args: [
        marketParams,
        amountWei,
        BigInt(0), // shares (0 means use assets)
        userAddress,
        userAddress // receiver
      ]
    })
    
    return borrowTx
  }

  /**
   * Borrow USDC against collateral
   */
  async borrowAsset(amount: string, userAddress: Address): Promise<string> {
    if (!window.ethereum) throw new Error('No wallet connected')
    
    const walletClient = createWalletClient({
      chain: CHAIN,
      transport: custom(window.ethereum)
    })
    
    const marketParams = this.getMarketParams()
    const amountWei = parseUnits(amount, 6) // USDC has 6 decimals
    
    const borrowTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'borrow',
      args: [
        marketParams,
        amountWei,
        BigInt(0), // shares (0 means use assets)
        userAddress,
        userAddress // receiver
      ],
      account: userAddress
    })
    
    return borrowTx
  }
  
  /**
   * Repay borrowed USDC
   */
  async repay(amount: string, userAddress: Address): Promise<string> {
    if (!window.ethereum) throw new Error('No wallet connected')
    
    const walletClient = createWalletClient({
      chain: CHAIN,
      transport: custom(window.ethereum)
    })
    
    const marketParams = this.getMarketParams()
    const amountWei = parseUnits(amount, 6) // USDC has 6 decimals
    
    // First approve Morpho to spend USDC
    const approveTx = await walletClient.writeContract({
      address: USDC,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [MORPHO_BLUE, amountWei],
      account: userAddress
    })
    
    await this.publicClient.waitForTransactionReceipt({ hash: approveTx })
    
    // Repay loan
    const repayTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'repay',
      args: [
        marketParams,
        amountWei,
        BigInt(0), // shares (0 means use assets)
        userAddress,
        '0x'
      ],
      account: userAddress
    })
    
    return repayTx
  }
  
  /**
   * Get oracle price for wstETH in ETH terms
   */
  private async getOraclePrice(): Promise<number> {
    // TODO: Query actual oracle contract
    // For now, return approximate mainnet price
    return 1.15 // wstETH is ~1.15 ETH on mainnet
  }
  
  /**
   * Get ETH price in USD from Chainlink
   */
  async getEthPrice(): Promise<number> {
    // Cache ETH price for 60 seconds
    const now = Date.now()
    if (this.cachedEthPrice && (now - this.ethPriceLastFetch) < 60000) {
      return this.cachedEthPrice
    }
    
    try {
      const result = await this.publicClient.readContract({
        address: CHAINLINK_ETH_USD,
        abi: [{
          inputs: [],
          name: 'latestRoundData',
          outputs: [
            { name: 'roundId', type: 'uint80' },
            { name: 'answer', type: 'int256' },
            { name: 'startedAt', type: 'uint256' },
            { name: 'updatedAt', type: 'uint256' },
            { name: 'answeredInRound', type: 'uint80' }
          ],
          stateMutability: 'view',
          type: 'function'
        }],
        functionName: 'latestRoundData'
      })
      
      // Chainlink returns price with 8 decimals
      const price = Number(result[1]) / 1e8
      this.cachedEthPrice = price
      this.ethPriceLastFetch = now
      return price
    } catch (error) {
      console.error('Failed to fetch ETH price:', error)
      // Fallback to approximate price if oracle fails
      return 4500
    }
  }
  
  /**
   * Check user's token balances
   */
  async getUserBalances(userAddress: Address): Promise<{ wstETH: number; usdc: number }> {
    const [wstETHBalance, usdcBalance] = await Promise.all([
      this.publicClient.readContract({
        address: WSTETH,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      }),
      this.publicClient.readContract({
        address: USDC,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress]
      })
    ])
    
    return {
      wstETH: Number(formatUnits(wstETHBalance, 18)),
      usdc: Number(formatUnits(usdcBalance, 6)) // USDC has 6 decimals
    }
  }
  
  /**
   * Bundled supply and borrow in a single transaction flow
   * This executes sequential transactions with error handling
   */
  async bundleSupplyAndBorrow(
    supplyAmount: string, 
    borrowAmount: string, 
    userAddress: Address
  ): Promise<{ supplyTx: string; borrowTx: string }> {
    if (!window.ethereum) throw new Error('No wallet connected')
    
    const walletClient = createWalletClient({
      chain: CHAIN,
      transport: custom(window.ethereum)
    })
    
    const marketParams = this.getMarketParams()
    const supplyAmountWei = parseUnits(supplyAmount, 18)
    const borrowAmountWei = parseUnits(borrowAmount, 6) // USDC has 6 decimals
    
    // Step 1: Approve wstETH for Morpho
    const approveTx = await walletClient.writeContract({
      address: WSTETH,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [MORPHO_BLUE, supplyAmountWei],
      account: userAddress
    })
    
    await this.publicClient.waitForTransactionReceipt({ hash: approveTx })
    
    // Step 2: Supply collateral
    const supplyTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'supplyCollateral',
      args: [
        marketParams,
        supplyAmountWei, // assets amount
        userAddress, // onBehalf
        '0x' // empty bytes for data parameter
      ],
      account: userAddress
    })
    
    await this.publicClient.waitForTransactionReceipt({ hash: supplyTx })
    
    // Step 3: Borrow USDC
    const borrowTx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: blueAbi,
      functionName: 'borrow',
      args: [
        marketParams,
        borrowAmountWei,
        BigInt(0),
        userAddress,
        userAddress
      ],
      account: userAddress
    })
    
    await this.publicClient.waitForTransactionReceipt({ hash: borrowTx })
    
    return { supplyTx, borrowTx }
  }
}

// Export singleton instance
export const morphoClient = new MorphoBlueClient()
