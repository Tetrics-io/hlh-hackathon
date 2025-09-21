'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { HyperliquidTradingV2 } from '@/lib/hyperliquid/trading-v2'
import toast from 'react-hot-toast'

export function useHyperliquidTradingV2() {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const trading = new HyperliquidTradingV2(true) // Use testnet
  
  /**
   * Place a limit order
   */
  const placeLimitOrder = async (
    privateKey: string,
    isBuy: boolean,
    price: number,
    size: number
  ) => {
    if (!address) {
      toast.error('Please connect wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await trading.placeOrder(
        privateKey,
        isBuy,
        price,
        size
      )
      
      if (result.status === 'ok') {
        toast.success(`${isBuy ? 'Buy' : 'Sell'} order placed successfully`)
      }
      
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
   * Place a market order
   */
  const placeMarketOrder = async (
    privateKey: string,
    isBuy: boolean,
    size: number
  ) => {
    if (!address) {
      toast.error('Please connect wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await trading.placeMarketOrder(
        privateKey,
        isBuy,
        size
      )
      
      if (result.status === 'ok') {
        toast.success(`Market ${isBuy ? 'buy' : 'sell'} order executed`)
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute market order'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  return {
    placeLimitOrder,
    placeMarketOrder,
    isLoading,
    error
  }
}