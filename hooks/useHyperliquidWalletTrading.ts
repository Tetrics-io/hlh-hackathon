'use client'

import { useState } from 'react'
import { useWalletClient } from 'wagmi'
import { HyperliquidWalletTrading } from '@/lib/hyperliquid/wallet-trading'
import toast from 'react-hot-toast'

export function useHyperliquidWalletTrading() {
  const { data: walletClient } = useWalletClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const trading = new HyperliquidWalletTrading(true) // Use testnet
  
  /**
   * Place a limit order using wallet
   */
  const placeLimitOrder = async (
    isBuy: boolean,
    price: number,
    size: number
  ) => {
    if (!walletClient) {
      toast.error('Please connect your wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      toast('Please sign the order in your wallet...')
      
      const result = await trading.placeOrderWithWallet(
        walletClient,
        isBuy,
        price,
        size
      )
      
      if (result.status === 'ok') {
        toast.success(`${isBuy ? 'Buy' : 'Sell'} order placed successfully`)
      } else {
        throw new Error(result.response || 'Order failed')
      }
      
      return result
    } catch (err: any) {
      const message = err?.message || 'Failed to place order'
      setError(message)
      
      // Check for common errors
      if (message.includes('User rejected')) {
        toast.error('Transaction cancelled by user')
      } else if (message.includes('insufficient')) {
        toast.error('Insufficient balance')
      } else {
        toast.error(message)
      }
      
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Place a market order using wallet
   */
  const placeMarketOrder = async (
    isBuy: boolean,
    size: number
  ) => {
    if (!walletClient) {
      toast.error('Please connect your wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      toast('Please sign the order in your wallet...')
      
      const result = await trading.placeMarketOrderWithWallet(
        walletClient,
        isBuy,
        size
      )
      
      if (result.status === 'ok') {
        toast.success(`Market ${isBuy ? 'buy' : 'sell'} order executed`)
      } else {
        throw new Error(result.response || 'Order failed')
      }
      
      return result
    } catch (err: any) {
      const message = err?.message || 'Failed to execute market order'
      setError(message)
      
      if (message.includes('User rejected')) {
        toast.error('Transaction cancelled by user')
      } else {
        toast.error(message)
      }
      
      return null
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * Approve builder for gasless trading
   */
  const approveBuilder = async (
    builderAddress: `0x${string}`,
    maxFeeRate = '0.001%' // Default to 0.001%
  ) => {
    if (!walletClient) {
      toast.error('Please connect your wallet')
      return null
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      toast('Please sign the builder approval in your wallet...')
      
      const result = await trading.approveBuilder(
        walletClient,
        builderAddress,
        maxFeeRate
      )
      
      if (result.status === 'ok') {
        toast.success('Builder approved successfully')
      } else {
        throw new Error(result.response || 'Approval failed')
      }
      
      return result
    } catch (err: any) {
      const message = err?.message || 'Failed to approve builder'
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
    approveBuilder,
    isLoading,
    error,
    isConnected: !!walletClient
  }
}