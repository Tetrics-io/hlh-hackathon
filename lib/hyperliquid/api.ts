interface ClearingHouseState {
  crossMarginSummary: {
    accountValue: string
    totalNtlPos: string
    totalRawUsd: string
    totalMarginUsed: string
  }
  withdrawable: string
  assetPositions: Array<{
    position: {
      coin: string
      szi: string
      entryPx: string | null
      positionValue: string
      returnOnEquity: string
      unrealizedPnl: string
      marginUsed: string
      maxTradeSzs: string[]
    }
  }>
}

interface MetaAndAssetCtxs {
  meta: {
    universe: Array<{
      name: string
      szDecimals: number
      maxLeverage: number
      onlyIsolated: boolean
    }>
  }
  assetCtxs: Array<{
    name: string
    szDecimals: number
    markPx: string
    midPx: string
    oraclePx: string
    fundingRate: string
    openInterest: string
    dayNtlVlm: string
  }>
}

export class HyperliquidAPI {
  private baseUrl: string
  private isTestnet: boolean
  
  constructor(isTestnet = false) {
    this.isTestnet = isTestnet
    this.baseUrl = isTestnet 
      ? 'https://api.hyperliquid-testnet.xyz'
      : 'https://api.hyperliquid.xyz'
  }
  
  private async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    return response.json()
  }
  
  /**
   * Get user's USDC balance on Hyperliquid
   */
  async getUserBalance(userAddress: string): Promise<number> {
    try {
      const data = await this.post<ClearingHouseState>('/info', {
        type: 'clearinghouseState',
        user: userAddress
      })
      
      // withdrawable is the USDC balance
      return parseFloat(data.withdrawable || '0')
    } catch (error) {
      console.error('Error fetching user balance:', error)
      return 0
    }
  }
  
  /**
   * Get mark price for HYPE perpetual (Asset ID: 135)
   */
  async getHypeMarkPrice(): Promise<number> {
    try {
      const data = await this.post<MetaAndAssetCtxs>('/info', {
        type: 'metaAndAssetCtxs'
      })
      
      // Find HYPE in the asset contexts
      // HYPE is typically at index 135 in the universe
      const hypeAsset = data.assetCtxs.find(ctx => ctx.name === 'HYPE')
      
      if (hypeAsset) {
        return parseFloat(hypeAsset.markPx)
      }
      
      // Fallback: try by index if name doesn't match
      if (data.assetCtxs[135]) {
        return parseFloat(data.assetCtxs[135].markPx)
      }
      
      return 0
    } catch (error) {
      console.error('Error fetching HYPE mark price:', error)
      return 0
    }
  }
  
  /**
   * Get all perpetual prices
   */
  async getAllPerpPrices(): Promise<Record<string, number>> {
    try {
      const data = await this.post<MetaAndAssetCtxs>('/info', {
        type: 'metaAndAssetCtxs'
      })
      
      const prices: Record<string, number> = {}
      
      data.assetCtxs.forEach((ctx, index) => {
        prices[ctx.name || `Asset${index}`] = parseFloat(ctx.markPx)
      })
      
      return prices
    } catch (error) {
      console.error('Error fetching perp prices:', error)
      return {}
    }
  }
  
  /**
   * Get user's account summary including positions
   */
  async getUserAccountSummary(userAddress: string): Promise<ClearingHouseState | null> {
    try {
      return await this.post<ClearingHouseState>('/info', {
        type: 'clearinghouseState',
        user: userAddress
      })
    } catch (error) {
      console.error('Error fetching account summary:', error)
      return null
    }
  }
}

// Export singleton instances
export const hyperliquidAPI = new HyperliquidAPI(false) // Mainnet
export const hyperliquidTestAPI = new HyperliquidAPI(true) // Testnet