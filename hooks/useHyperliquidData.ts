'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { hyperliquidAPI } from '@/lib/hyperliquid/api'

interface HyperliquidData {
  balance: number
  hypeMarkPrice: number
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
}

export function useHyperliquidData(pollingInterval = 5000) {
  const { address, isConnected } = useAccount()
  const [data, setData] = useState<HyperliquidData>({
    balance: 0,
    hypeMarkPrice: 0,
    isLoading: false,
    error: null,
    lastUpdate: null
  })
  
  useEffect(() => {
    if (!isConnected || !address) {
      setData(prev => ({ ...prev, balance: 0, error: null }))
      return
    }
    
    let intervalId: NodeJS.Timeout
    let isMounted = true
    
    const fetchData = async () => {
      if (!isMounted) return
      
      setData(prev => ({ ...prev, isLoading: true, error: null }))
      
      try {
        // Fetch balance and price in parallel
        const [balance, hypeMarkPrice] = await Promise.all([
          hyperliquidAPI.getUserBalance(address),
          hyperliquidAPI.getHypeMarkPrice()
        ])
        
        if (isMounted) {
          setData({
            balance,
            hypeMarkPrice,
            isLoading: false,
            error: null,
            lastUpdate: new Date()
          })
        }
      } catch (error) {
        if (isMounted) {
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch data'
          }))
        }
      }
    }
    
    // Initial fetch
    fetchData()
    
    // Set up polling
    intervalId = setInterval(fetchData, pollingInterval)
    
    // Cleanup
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [address, isConnected, pollingInterval])
  
  return data
}

export function useHyperliquidBalance(pollingInterval = 5000) {
  const { address, isConnected } = useAccount()
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!isConnected || !address) {
      setBalance(0)
      return
    }
    
    let intervalId: NodeJS.Timeout
    let isMounted = true
    
    const fetchBalance = async () => {
      if (!isMounted) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const userBalance = await hyperliquidAPI.getUserBalance(address)
        if (isMounted) {
          setBalance(userBalance)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch balance')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Initial fetch
    fetchBalance()
    
    // Set up polling
    intervalId = setInterval(fetchBalance, pollingInterval)
    
    // Cleanup
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [address, isConnected, pollingInterval])
  
  return { balance, isLoading, error }
}

export function useHypeMarkPrice(pollingInterval = 5000) {
  const [price, setPrice] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let isMounted = true
    
    const fetchPrice = async () => {
      if (!isMounted) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const markPrice = await hyperliquidAPI.getHypeMarkPrice()
        if (isMounted) {
          setPrice(markPrice)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch price')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    // Initial fetch
    fetchPrice()
    
    // Set up polling
    intervalId = setInterval(fetchPrice, pollingInterval)
    
    // Cleanup
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [pollingInterval])
  
  return { price, isLoading, error }
}