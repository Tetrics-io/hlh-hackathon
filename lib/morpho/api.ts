import { ethers } from 'ethers'
import { BlueSDK, type MarketParams, type Market } from '@morpho-org/blue-sdk-ethers'

// Market addresses from Morpho Blue
const MORPHO_BLUE_ADDRESS = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' // Morpho Blue on Ethereum
const WSTETH_USDC_MARKET_ID = '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc' // wstETH/USDC market

// Token addresses
const WSTETH_ADDRESS = '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' // wstETH on Ethereum
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // USDC on Ethereum

// Oracle for wstETH/USDC
const ORACLE_ADDRESS = '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2' // Chainlink Oracle for wstETH/USDC

interface MorphoPosition {
  suppliedCollateral: bigint
  borrowedAssets: bigint
}

interface MorphoMarketData {
  marketId: string
  lltv: number // Liquidation Loan-to-Value
  irm: string // Interest Rate Model address
  oracle: string
  totalSupplyAssets: bigint
  totalBorrowAssets: bigint
  supplyAPY: number
  borrowAPY: number
  borrowCap?: bigint
}

interface UserPositionData {
  collateralBalance: number // wstETH
  borrowedBalance: number // USDC
  healthFactor: number
  ltv: number
  liquidationThreshold: number
  maxBorrowable: number
}

export class MorphoBlueAPI {
  private provider: ethers.Provider
  private sdk: BlueSDK | null = null
  
  constructor(provider?: ethers.Provider) {
    // Use provided provider or default to Ethereum mainnet
    this.provider = provider || new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_ETH_RPC_URL || 
      'https://eth-mainnet.g.alchemy.com/v2/demo'
    )
  }
  
  private async initSDK() {
    if (!this.sdk) {
      this.sdk = new BlueSDK(
        this.provider as ethers.JsonRpcProvider,
        { morpho: MORPHO_BLUE_ADDRESS }
      )
    }
    return this.sdk
  }
  
  /**
   * Get wstETH/USDC market data
   */
  async getMarketData(): Promise<MorphoMarketData | null> {
    try {
      const sdk = await this.initSDK()
      
      // Market parameters for wstETH/USDC
      const marketParams: MarketParams = {
        loanToken: USDC_ADDRESS,
        collateralToken: WSTETH_ADDRESS,
        oracle: ORACLE_ADDRESS,
        irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC', // AdaptiveCurveIrm
        lltv: ethers.parseUnits('0.945', 18) // 94.5% LLTV
      }
      
      // Get market info
      const market = await sdk.getMarket(marketParams)
      
      if (!market) {
        return null
      }
      
      // Calculate APYs (simplified - actual calculation is more complex)
      const supplyAPY = this.calculateAPY(market.supplyRate || 0n)
      const borrowAPY = this.calculateAPY(market.borrowRate || 0n)
      
      return {
        marketId: WSTETH_USDC_MARKET_ID,
        lltv: 94.5,
        irm: marketParams.irm,
        oracle: marketParams.oracle,
        totalSupplyAssets: market.totalSupplyAssets || 0n,
        totalBorrowAssets: market.totalBorrowAssets || 0n,
        supplyAPY,
        borrowAPY,
        borrowCap: market.totalSupplyCap
      }
    } catch (error) {
      console.error('Error fetching Morpho market data:', error)
      return null
    }
  }
  
  /**
   * Get user's position in wstETH/USDC market
   */
  async getUserPosition(userAddress: string): Promise<UserPositionData | null> {
    try {
      const sdk = await this.initSDK()
      
      // Market parameters for wstETH/USDC
      const marketParams: MarketParams = {
        loanToken: USDC_ADDRESS,
        collateralToken: WSTETH_ADDRESS,
        oracle: ORACLE_ADDRESS,
        irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
        lltv: ethers.parseUnits('0.945', 18)
      }
      
      // Get user position
      const position = await sdk.getUserPosition(marketParams, userAddress)
      
      if (!position) {
        return {
          collateralBalance: 0,
          borrowedBalance: 0,
          healthFactor: 0,
          ltv: 0,
          liquidationThreshold: 94.5,
          maxBorrowable: 0
        }
      }
      
      // Convert from wei/base units to human readable
      const collateralBalance = Number(ethers.formatUnits(position.collateral || 0n, 18))
      const borrowedBalance = Number(ethers.formatUnits(position.borrowShares || 0n, 6)) // USDC has 6 decimals
      
      // Get oracle price for wstETH in USDC terms
      const oraclePrice = await this.getOraclePrice()
      
      // Calculate health factor
      const collateralValueUSD = collateralBalance * oraclePrice
      const maxBorrowable = collateralValueUSD * 0.945 // 94.5% LLTV
      const currentLTV = borrowedBalance > 0 ? (borrowedBalance / collateralValueUSD) : 0
      const healthFactor = borrowedBalance > 0 ? (maxBorrowable / borrowedBalance) : 0
      
      return {
        collateralBalance,
        borrowedBalance,
        healthFactor,
        ltv: currentLTV * 100,
        liquidationThreshold: 94.5,
        maxBorrowable
      }
    } catch (error) {
      console.error('Error fetching user position:', error)
      return null
    }
  }
  
  /**
   * Get oracle price for wstETH in USDC terms
   */
  private async getOraclePrice(): Promise<number> {
    try {
      // Simplified - in production, you'd query the actual oracle contract
      // For now, return an approximate price
      return 4500 // $4500 per wstETH
    } catch (error) {
      console.error('Error fetching oracle price:', error)
      return 4500 // Fallback price
    }
  }
  
  /**
   * Calculate APY from rate per second
   */
  private calculateAPY(ratePerSecond: bigint): number {
    if (ratePerSecond === 0n) return 0
    
    // Convert rate per second to APY
    // APY = ((1 + rate)^(seconds_in_year) - 1) * 100
    const secondsInYear = 31536000
    const rate = Number(ratePerSecond) / 1e18
    const apy = (Math.pow(1 + rate, secondsInYear) - 1) * 100
    
    return Math.min(apy, 999) // Cap at 999% for display
  }
  
  /**
   * Format health factor for display
   */
  static formatHealthFactor(healthFactor: number): string {
    if (healthFactor === 0) return 'N/A'
    if (healthFactor > 100) return '∞'
    if (healthFactor < 1) return `⚠️ ${healthFactor.toFixed(2)}`
    return healthFactor.toFixed(2)
  }
  
  /**
   * Get health factor color
   */
  static getHealthFactorColor(healthFactor: number): string {
    if (healthFactor === 0) return 'text-gray-500'
    if (healthFactor > 1.5) return 'text-green-600'
    if (healthFactor > 1.2) return 'text-yellow-600'
    return 'text-red-600'
  }
}

// Export singleton instance
export const morphoAPI = new MorphoBlueAPI()