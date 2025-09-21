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

interface SpotClearingHouseState {
  balances: Array<{
    coin: string
    token: number
    total: string
    hold: string
    entryNtl: string
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
  
  constructor(baseUrl?: string, isTestnet = false) {
    this.isTestnet = isTestnet
    this.baseUrl = baseUrl || (isTestnet 
      ? 'https://api.hyperliquid-testnet.xyz'
      : 'https://api.hyperliquid.xyz')
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
   * Get user's USDC balance on Hyperliquid (spot balance)
   */
  async getUserBalance(userAddress: string): Promise<number> {
    try {
      // Fetch spot balances
      const spotData = await this.post<SpotClearingHouseState>('/info', {
        type: 'spotClearinghouseState',
        user: userAddress
      })
      
      // Validate response
      if (!spotData || !spotData.balances) {
        console.warn('No spot data returned from API')
        return 0
      }
      
      // Find USDC balance
      const usdcBalance = spotData.balances.find(b => b.coin === 'USDC')
      if (usdcBalance) {
        return parseFloat(usdcBalance.total || '0')
      }
      
      // Fallback to perps clearinghouse for backward compatibility
      const perpsData = await this.post<ClearingHouseState>('/info', {
        type: 'clearinghouseState',
        user: userAddress
      })
      
      if (!perpsData) {
        return 0
      }
      
      return parseFloat(perpsData.withdrawable || '0')
    } catch (error) {
      console.error('Error fetching user balance:', error)
      return 0
    }
  }
  
  /**
   * Get mark price for HYPE perpetual
   */
  async getHypeMarkPrice(): Promise<number> {
    try {
      // The API returns an array: [meta, assetCtxs]
      const response = await this.post<any[]>('/info', {
        type: 'metaAndAssetCtxs'
      })
      
      // Validate response structure
      if (!response || !Array.isArray(response) || response.length < 2) {
        console.warn('Invalid API response structure')
        return 0
      }
      
      const [meta, assetCtxs] = response
      
      if (!Array.isArray(assetCtxs)) {
        console.warn('Asset contexts not found in response')
        return 0
      }
      
      // Find HYPE index in the universe
      let hypeIndex = -1
      if (meta && meta.universe && Array.isArray(meta.universe)) {
        hypeIndex = meta.universe.findIndex((asset: any) => 
          asset && asset.name && asset.name.toUpperCase() === 'HYPE'
        )
      }
      
      // If HYPE found in universe, use that index to get price
      if (hypeIndex >= 0 && assetCtxs[hypeIndex]) {
        const hypeAsset = assetCtxs[hypeIndex]
        if (hypeAsset && hypeAsset.markPx) {
          return parseFloat(hypeAsset.markPx)
        }
      }
      
      // Fallback: search directly in assetCtxs (shouldn't be needed)
      for (const ctx of assetCtxs) {
        if (ctx && ctx.markPx && ctx.name === 'HYPE') {
          return parseFloat(ctx.markPx)
        }
      }
      
      console.warn('HYPE asset not found in API response')
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
      
      // Validate response
      if (!data || !data.assetCtxs || !Array.isArray(data.assetCtxs)) {
        console.warn('Invalid API response for perp prices')
        return {}
      }
      
      const prices: Record<string, number> = {}
      
      data.assetCtxs.forEach((ctx, index) => {
        if (ctx && ctx.markPx) {
          prices[ctx.name || `Asset${index}`] = parseFloat(ctx.markPx)
        }
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
  
  /**
   * Get user's spot balances including USDC and HYPE
   */
  async getUserSpotBalances(userAddress: string): Promise<SpotClearingHouseState | null> {
    try {
      return await this.post<SpotClearingHouseState>('/info', {
        type: 'spotClearinghouseState',
        user: userAddress
      })
    } catch (error) {
      console.error('Error fetching spot balances:', error)
      return null
    }
  }
}

// Export singleton instances (deprecated - use createHyperliquidAPI instead)
export const hyperliquidAPI = new HyperliquidAPI(undefined, false) // Mainnet
export const hyperliquidTestAPI = new HyperliquidAPI(undefined, true) // Testnet

// Factory function for creating API instance with specific network
export function createHyperliquidAPI(apiUrl: string, isTestnet = false) {
  return new HyperliquidAPI(apiUrl, isTestnet)
}