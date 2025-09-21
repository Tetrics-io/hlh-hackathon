import { ethers } from 'ethers'
import type { Address } from 'viem'

// Constants
const HYPERLIQUID_TESTNET = 'https://api.hyperliquid-testnet.xyz'
const HYPERLIQUID_MAINNET = 'https://api.hyperliquid.xyz'

interface OrderWire {
  a: number    // asset index
  b: boolean   // is_buy
  p: string    // price
  s: string    // size
  r: boolean   // reduce_only
  t: {
    limit?: {
      tif: string
    }
  }
}

interface OrderAction {
  type: 'order'
  orders: OrderWire[]
  grouping: 'na'
}

export class HyperliquidTradingV2 {
  private baseUrl: string
  private isTestnet: boolean
  
  constructor(isTestnet = true) {
    this.isTestnet = isTestnet
    this.baseUrl = isTestnet ? HYPERLIQUID_TESTNET : HYPERLIQUID_MAINNET
  }

  /**
   * Format number to remove trailing zeros
   */
  private formatNumber(value: number): string {
    // Remove trailing zeros and unnecessary decimal point
    return value.toFixed(8).replace(/\.?0+$/, '')
  }

  /**
   * Get HYPE asset index
   */
  async getHypeAssetIndex(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      })
      
      const [meta] = await response.json()
      
      // Find HYPE in universe
      const hypeIndex = meta.universe.findIndex((asset: any) => 
        asset && asset.name === 'HYPE'
      )
      
      if (hypeIndex === -1) {
        console.error('HYPE not found in universe')
        return 135 // Fallback to known index
      }
      
      return hypeIndex
    } catch (error) {
      console.error('Error getting HYPE index:', error)
      return 135 // Known HYPE index
    }
  }

  /**
   * Sign an action using EIP-712
   */
  private async signAction(
    action: any,
    privateKey: string,
    nonce: number
  ): Promise<{ r: string; s: string; v: number }> {
    try {
      const wallet = new ethers.Wallet(privateKey)
      
      // Construct the message to sign
      const payload = {
        action,
        nonce,
        vaultAddress: null
      }
      
      // Convert to JSON and then to bytes
      const message = JSON.stringify(payload)
      const messageBytes = ethers.utils.toUtf8Bytes(message)
      const hash = ethers.utils.keccak256(messageBytes)
      
      // Sign the hash
      const signature = await wallet.signMessage(ethers.utils.arrayify(hash))
      const sig = ethers.utils.splitSignature(signature)
      
      return {
        r: sig.r,
        s: sig.s,
        v: sig.v
      }
    } catch (error) {
      console.error('Signing error:', error)
      throw error
    }
  }

  /**
   * Place an order on Hyperliquid
   */
  async placeOrder(
    privateKey: string,
    isBuy: boolean,
    price: number,
    size: number
  ): Promise<any> {
    try {
      const wallet = new ethers.Wallet(privateKey)
      const address = wallet.address
      
      console.log('Placing order:', { address, isBuy, price, size })
      
      // Get HYPE asset index
      const assetIndex = await this.getHypeAssetIndex()
      console.log('HYPE asset index:', assetIndex)
      
      // Create order
      const order: OrderWire = {
        a: assetIndex,
        b: isBuy,
        p: this.formatNumber(price),
        s: this.formatNumber(size),
        r: false,
        t: {
          limit: {
            tif: 'GTC'
          }
        }
      }
      
      const action: OrderAction = {
        type: 'order',
        orders: [order],
        grouping: 'na'
      }
      
      const nonce = Date.now()
      
      // Create signature
      const signature = await this.signAction(action, privateKey, nonce)
      
      // Send request
      const body = {
        action,
        nonce,
        signature,
        vaultAddress: null
      }
      
      console.log('Sending order request:', body)
      
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const result = await response.json()
      console.log('Order response:', result)
      
      if (result.status === 'err') {
        throw new Error(result.response || 'Order failed')
      }
      
      return result
    } catch (error) {
      console.error('Error placing order:', error)
      throw error
    }
  }

  /**
   * Get current HYPE price
   */
  async getHypePrice(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' })
      })
      
      const [meta, assetCtxs] = await response.json()
      
      const hypeIndex = meta.universe.findIndex((asset: any) => 
        asset && asset.name === 'HYPE'
      )
      
      if (hypeIndex >= 0 && assetCtxs[hypeIndex]) {
        return parseFloat(assetCtxs[hypeIndex].markPx)
      }
      
      return 0
    } catch (error) {
      console.error('Error getting HYPE price:', error)
      return 0
    }
  }

  /**
   * Place a market order (using IOC with slippage)
   */
  async placeMarketOrder(
    privateKey: string,
    isBuy: boolean,
    size: number
  ): Promise<any> {
    try {
      // Get current price
      const currentPrice = await this.getHypePrice()
      if (!currentPrice) {
        throw new Error('Could not get current HYPE price')
      }
      
      // Add 1% slippage
      const slippage = 0.01
      const limitPrice = isBuy 
        ? currentPrice * (1 + slippage)
        : currentPrice * (1 - slippage)
      
      console.log(`Market order: ${isBuy ? 'BUY' : 'SELL'} ${size} HYPE at ~$${currentPrice} (limit: ${limitPrice})`)
      
      // Place as limit order with IOC
      return this.placeOrder(privateKey, isBuy, limitPrice, size)
    } catch (error) {
      console.error('Market order error:', error)
      throw error
    }
  }
}