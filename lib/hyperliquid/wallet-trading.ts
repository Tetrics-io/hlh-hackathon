import { type WalletClient, parseSignature } from 'viem'
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

export class HyperliquidWalletTrading {
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
      return 135
    }
  }

  /**
   * Create the typed data for EIP-712 signing
   */
  private createTypedData(action: OrderAction, nonce: number, address: Address) {
    // Hyperliquid uses a specific EIP-712 structure
    const domain = {
      name: 'Hyperliquid',
      version: '1',
      chainId: this.isTestnet ? 421614 : 42161, // Arbitrum Sepolia or Mainnet
      verifyingContract: '0x0000000000000000000000000000000000000000' as Address
    }

    const types = {
      Order: [
        { name: 'action', type: 'string' },
        { name: 'nonce', type: 'uint256' },
        { name: 'vaultAddress', type: 'address' }
      ]
    }

    const message = {
      action: JSON.stringify(action),
      nonce: BigInt(nonce),
      vaultAddress: '0x0000000000000000000000000000000000000000' as Address
    }

    return {
      domain,
      types,
      primaryType: 'Order' as const,
      message
    }
  }

  /**
   * Sign L1 action (orders) using wallet
   * Note: Hyperliquid L1 actions require special handling
   */
  async signL1Action(
    walletClient: WalletClient,
    action: OrderAction,
    nonce: number
  ): Promise<{ r: string; s: string; v: number }> {
    try {
      const address = walletClient.account?.address
      if (!address) throw new Error('No account connected')

      // For L1 actions, we need to use a raw message signature
      // because EIP-712 with chain ID 1337 would fail with wallet connected to chain 998
      // This is how most Hyperliquid integrations handle it
      
      const payload = {
        action,
        nonce,
        vaultAddress: null
      }
      
      // Convert to a deterministic string format
      const message = JSON.stringify(payload)
      
      console.log('Signing L1 action:', message)
      
      // Sign the raw message
      const signature = await walletClient.signMessage({
        account: walletClient.account!,
        message
      })
      
      // Parse the signature to get r, s, v components
      const parsedSig = parseSignature(signature)
      
      return {
        r: parsedSig.r,
        s: parsedSig.s,
        v: Number(parsedSig.v)
      }
    } catch (error) {
      console.error('L1 action signing error:', error)
      throw error
    }
  }

  /**
   * Sign user-signed action using EIP-712 typed data
   */
  async signUserSignedAction(
    walletClient: WalletClient,
    action: any,
    nonce: number
  ): Promise<{ r: string; s: string; v: number }> {
    try {
      const address = walletClient.account?.address
      if (!address) throw new Error('No account connected')
      
      console.log('Signing with address:', address)

      // Normalize addresses (lowercase)
      if (action.builder) {
        action.builder = action.builder.toLowerCase()
      }

      // Set the correct signature chain ID for user-signed actions
      action.signatureChainId = '0x66eee'
      action.nonce = nonce

      // Create EIP-712 typed data
      // For Hyperliquid, we need to use the actual chain ID from the wallet
      const chainId = await walletClient.getChainId()
      
      const domain = {
        name: 'HyperliquidSignTransaction',
        version: '1',
        chainId, // Use the actual chain ID from the wallet (998 for Hyperliquid testnet)
        verifyingContract: '0x0000000000000000000000000000000000000000' as Address
      }

      const types = {
        'HyperliquidTransaction:ApproveBuilderFee': [
          { name: 'hyperliquidChain', type: 'string' },
          { name: 'maxFeeRate', type: 'string' },
          { name: 'builder', type: 'address' },
          { name: 'nonce', type: 'uint64' },
          { name: 'signatureChainId', type: 'string' }
        ]
      }

      const primaryType = 'HyperliquidTransaction:ApproveBuilderFee'

      // Sign the typed data
      const signature = await walletClient.signTypedData({
        account: walletClient.account!,
        domain,
        types,
        primaryType,
        message: action
      })

      // Parse the signature to get r, s, v
      const parsedSig = parseSignature(signature)
      
      return {
        r: parsedSig.r,
        s: parsedSig.s,
        v: Number(parsedSig.v)
      }
    } catch (error) {
      console.error('User signed action error:', error)
      throw error
    }
  }

  /**
   * Place an order using wallet signing
   */
  async placeOrderWithWallet(
    walletClient: WalletClient,
    isBuy: boolean,
    price: number,
    size: number
  ): Promise<any> {
    try {
      const address = walletClient.account?.address
      if (!address) throw new Error('No wallet connected')
      
      console.log('Placing order with wallet:', { address, isBuy, price, size })
      
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
            tif: 'Gtc'  // Must be 'Gtc' not 'GTC'
          }
        }
      }
      
      const action: OrderAction = {
        type: 'order',
        orders: [order],
        grouping: 'na'
      }
      
      const nonce = Date.now()
      
      // Sign with L1 action signing (for orders)
      const signature = await this.signL1Action(walletClient, action, nonce)
      
      // Send request with proper structure
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
      
      const text = await response.text()
      console.log('Order response text:', text)
      
      try {
        const result = JSON.parse(text)
        console.log('Order response:', result)
        
        if (result.status === 'err') {
          throw new Error(result.response || 'Order failed')
        }
        
        return result
      } catch (parseError) {
        // If response is not JSON, throw the raw text as error
        throw new Error(text || 'Failed to parse response')
      }
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
   * Place a market order using wallet
   */
  async placeMarketOrderWithWallet(
    walletClient: WalletClient,
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
      
      return this.placeOrderWithWallet(walletClient, isBuy, limitPrice, size)
    } catch (error) {
      console.error('Market order error:', error)
      throw error
    }
  }

  /**
   * Approve builder for gasless trading
   */
  async approveBuilder(
    walletClient: WalletClient,
    builderAddress: Address,
    maxFeeRate: string // e.g., "0.001%" 
  ): Promise<any> {
    try {
      const address = walletClient.account?.address
      if (!address) throw new Error('No wallet connected')
      
      console.log('Approving builder:', { 
        userAddress: address,
        builderAddress, 
        maxFeeRate 
      })
      
      const nonce = Date.now()
      
      // Create the action object with correct structure for approveBuilderFee
      const action = {
        type: 'approveBuilderFee',
        hyperliquidChain: this.isTestnet ? 'Testnet' : 'Mainnet',
        signatureChainId: '0x66eee',
        maxFeeRate,
        builder: builderAddress.toLowerCase(), // Normalize address
        nonce
      }
      
      // IMPORTANT: Hyperliquid requires a specific message format for signature verification
      // The message must be a string that starts with specific prefixes for Ethereum signing
      
      // Create the action string that will be signed
      const actionString = JSON.stringify({
        type: action.type,
        hyperliquidChain: action.hyperliquidChain,
        signatureChainId: action.signatureChainId,
        maxFeeRate: action.maxFeeRate,
        builder: action.builder,
        nonce: action.nonce
      })
      
      // Create the full message in the exact format Hyperliquid expects
      // This uses personal_sign which adds the Ethereum prefix automatically
      const fullMessage = `{"action":${actionString},"nonce":${nonce},"vaultAddress":null}`
      
      console.log('Signing message for address:', address)
      console.log('Message to sign:', fullMessage)
      
      // Use personal_sign (signMessage) which adds "\x19Ethereum Signed Message:\n" prefix
      const rawSignature = await walletClient.signMessage({
        account: walletClient.account!,
        message: fullMessage
      })
      
      console.log('Raw signature:', rawSignature)
      
      // Parse to r, s, v format
      const parsedSig = parseSignature(rawSignature)
      const signature = {
        r: parsedSig.r,
        s: parsedSig.s,
        v: Number(parsedSig.v)
      }
      
      console.log('Parsed signature:', signature)
      
      // The payload should have action, nonce, signature, and vaultAddress as separate fields
      const payload = {
        action,
        nonce,
        signature,
        vaultAddress: null
      }
      
      console.log('Sending approval request:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(`${this.baseUrl}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const text = await response.text()
      console.log('Raw response:', text)
      
      try {
        const result = JSON.parse(text)
        if (result.status === 'err') {
          throw new Error(result.response || 'Builder approval failed')
        }
        return result
      } catch (parseError) {
        // If response is not JSON, throw the raw text as error
        throw new Error(text || 'Failed to parse response')
      }
    } catch (error) {
      console.error('Error approving builder:', error)
      throw error
    }
  }
}