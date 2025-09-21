import { ethers } from 'ethers'
import type { Address } from 'viem'

interface OrderRequest {
  asset: number  // Asset index (HYPE = 135)
  isBuy: boolean
  price: string
  size: string
  reduceOnly?: boolean
  orderType?: {
    limit?: {
      tif: 'ALO' | 'IOC' | 'GTC'  // Time in Force
    }
    trigger?: {
      triggerPx: string
      isMarket: boolean
      tpsl: 'tp' | 'sl'
    }
  }
  cloid?: string  // Client Order ID
}

interface PlaceOrderAction {
  type: 'order'
  orders: Array<{
    a: number      // asset
    b: boolean     // is_buy
    p: string      // price
    s: string      // size
    r: boolean     // reduce_only
    t: {
      limit?: {
        tif: string
      }
      trigger?: {
        triggerPx: string
        isMarket: boolean
        tpsl: string
      }
    }
    c?: string     // cloid
  }>
  grouping: 'na'
  builderFee?: number
}

export class HyperliquidTrading {
  private baseUrl: string
  private isTestnet: boolean
  
  constructor(isTestnet = false) {
    this.isTestnet = isTestnet
    this.baseUrl = isTestnet 
      ? 'https://api.hyperliquid-testnet.xyz'
      : 'https://api.hyperliquid.xyz'
  }

  /**
   * Get asset index for a symbol
   */
  async getAssetIndex(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      })
      
      const [meta] = await response.json()
      
      const index = meta.universe.findIndex((asset: any) => 
        asset.name.toUpperCase() === symbol.toUpperCase()
      )
      
      if (index === -1) {
        throw new Error(`Asset ${symbol} not found`)
      }
      
      return index
    } catch (error) {
      console.error('Error getting asset index:', error)
      throw error
    }
  }

  /**
   * Create signature for order
   */
  private async createSignature(
    action: PlaceOrderAction,
    nonce: number,
    privateKey: string
  ): Promise<string> {
    const msgPackBytes = this.encodeAction(action, nonce)
    const wallet = new ethers.Wallet(privateKey)
    return wallet.signMessage(msgPackBytes)
  }

  /**
   * Encode action for signing (simplified - real implementation needs msgpack)
   */
  private encodeAction(action: PlaceOrderAction, nonce: number): Uint8Array {
    // This is a simplified version - actual implementation needs msgpack encoding
    const message = {
      action,
      nonce,
      vaultAddress: null
    }
    return ethers.utils.toUtf8Bytes(JSON.stringify(message))
  }

  /**
   * Place a limit order
   */
  async placeLimitOrder(
    userAddress: Address,
    privateKey: string,
    symbol: string,
    isBuy: boolean,
    price: number,
    size: number,
    postOnly = false
  ): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(symbol)
      const nonce = Date.now()
      
      const action: PlaceOrderAction = {
        type: 'order',
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: price.toString(),
          s: size.toString(),
          r: false,
          t: {
            limit: {
              tif: postOnly ? 'ALO' : 'GTC'
            }
          }
        }],
        grouping: 'na'
      }
      
      const signature = await this.createSignature(action, nonce, privateKey)
      
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          nonce,
          signature,
          vaultAddress: null
        })
      })
      
      return response.json()
    } catch (error) {
      console.error('Error placing order:', error)
      throw error
    }
  }

  /**
   * Place a market order
   */
  async placeMarketOrder(
    userAddress: Address,
    privateKey: string,
    symbol: string,
    isBuy: boolean,
    size: number
  ): Promise<any> {
    try {
      const assetIndex = await this.getAssetIndex(symbol)
      const nonce = Date.now()
      
      // Get current price for slippage calculation
      const markPrice = await this.getMarkPrice(symbol)
      const slippage = 0.01 // 1% slippage
      const limitPrice = isBuy 
        ? markPrice * (1 + slippage)
        : markPrice * (1 - slippage)
      
      const action: PlaceOrderAction = {
        type: 'order',
        orders: [{
          a: assetIndex,
          b: isBuy,
          p: limitPrice.toString(),
          s: size.toString(),
          r: false,
          t: {
            limit: {
              tif: 'IOC'  // Immediate or cancel for market-like behavior
            }
          }
        }],
        grouping: 'na'
      }
      
      const signature = await this.createSignature(action, nonce, privateKey)
      
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          nonce,
          signature,
          vaultAddress: null
        })
      })
      
      return response.json()
    } catch (error) {
      console.error('Error placing market order:', error)
      throw error
    }
  }

  /**
   * Get mark price for an asset
   */
  async getMarkPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      })
      
      const [meta, assetCtxs] = await response.json()
      
      const index = meta.universe.findIndex((asset: any) => 
        asset.name.toUpperCase() === symbol.toUpperCase()
      )
      
      if (index >= 0 && assetCtxs[index]) {
        return parseFloat(assetCtxs[index].markPx)
      }
      
      throw new Error(`Price not found for ${symbol}`)
    } catch (error) {
      console.error('Error getting mark price:', error)
      throw error
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(
    userAddress: Address,
    privateKey: string,
    orderId: string | { oid: number, cloid?: string }
  ): Promise<any> {
    try {
      const nonce = Date.now()
      
      const action = {
        type: 'cancel',
        cancels: [orderId]
      }
      
      const signature = await this.createSignature(action as any, nonce, privateKey)
      
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          nonce,
          signature,
          vaultAddress: null
        })
      })
      
      return response.json()
    } catch (error) {
      console.error('Error cancelling order:', error)
      throw error
    }
  }

  /**
   * Get open orders
   */
  async getOpenOrders(userAddress: Address): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'openOrders',
          user: userAddress
        })
      })
      
      return response.json()
    } catch (error) {
      console.error('Error getting open orders:', error)
      throw error
    }
  }
}

// Export singleton for convenience
export const hyperliquidTrading = new HyperliquidTrading(true) // testnet by default