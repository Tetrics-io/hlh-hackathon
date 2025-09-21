'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { HyperliquidTrading } from '@/lib/hyperliquid/trading'
import { useNetwork } from '@/contexts/NetworkContext'
import toast from 'react-hot-toast'

export function useHyperliquidTrading() {
  const { address } = useAccount()
  const { isTestnet } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const trading = new HyperliquidTrading(isTestnet)
  
  /**
   * Place a buy order for HYPE
   */
  const buyHype = async (
    size: number,
    price?: number,
    isMarket = false
  ) => {
    if (!address) {
      toast.error('Please connect wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // For demo purposes, we'll need the user to sign with their private key
      // In production, this would use a secure signing method
      const privateKey = prompt('Enter your private key (for demo only - never do this in production!)')
      if (!privateKey) {
        throw new Error('Private key required')
      }
      
      let result
      if (isMarket) {
        result = await trading.placeMarketOrder(
          address,
          privateKey,
          'HYPE',
          true, // buy
          size
        )
      } else if (price) {
        result = await trading.placeLimitOrder(
          address,
          privateKey,
          'HYPE',
          true, // buy
          price,
          size
        )
      } else {
        throw new Error('Price required for limit order')
      }
      
      toast.success(`Buy order placed for ${size} HYPE`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Place a sell order for HYPE
   */
  const sellHype = async (
    size: number,
    price?: number,
    isMarket = false
  ) => {
    if (!address) {
      toast.error('Please connect wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const privateKey = prompt('Enter your private key (for demo only - never do this in production!)')
      if (!privateKey) {
        throw new Error('Private key required')
      }
      
      let result
      if (isMarket) {
        result = await trading.placeMarketOrder(
          address,
          privateKey,
          'HYPE',
          false, // sell
          size
        )
      } else if (price) {
        result = await trading.placeLimitOrder(
          address,
          privateKey,
          'HYPE',
          false, // sell
          price,
          size
        )
      } else {
        throw new Error('Price required for limit order')
      }
      
      toast.success(`Sell order placed for ${size} HYPE`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to place order'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Get open orders
   */
  const getOpenOrders = async () => {
    if (!address) return []
    
    try {
      return await trading.getOpenOrders(address)
    } catch (err) {
      console.error('Failed to get open orders:', err)
      return []
    }
  }
  
  /**
   * Cancel an order
   */
  const cancelOrder = async (orderId: string | { oid: number }) => {
    if (!address) {
      toast.error('Please connect wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const privateKey = prompt('Enter your private key (for demo only - never do this in production!)')
      if (!privateKey) {
        throw new Error('Private key required')
      }
      
      const result = await trading.cancelOrder(address, privateKey, orderId)
      toast.success('Order cancelled')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel order'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  return {
    buyHype,
    sellHype,
    getOpenOrders,
    cancelOrder,
    isLoading,
    error
  }
}