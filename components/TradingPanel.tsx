'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { HyperliquidWalletTradingPanel } from '@/components/HyperliquidWalletTradingPanel'

export function TradingPanel() {
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  
  // Ensure component is mounted before checking connection states
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Show loading state until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-sm text-gray-400 mt-2">Loading trading panel...</p>
        </div>
      </div>
    )
  }
  
  if (!isConnected) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <p className="text-gray-400 text-center">Please connect your wallet to trade</p>
      </div>
    )
  }
  
  // Use the wallet-based Hyperliquid trading panel
  return <HyperliquidWalletTradingPanel />
}