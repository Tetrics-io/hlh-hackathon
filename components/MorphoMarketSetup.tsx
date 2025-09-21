'use client'

import { useState } from 'react'
import { setupMorphoMarket } from '@/lib/morpho/market-creator'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import toast from 'react-hot-toast'

export default function MorphoMarketSetup() {
  const [isCreating, setIsCreating] = useState(false)
  const [marketId, setMarketId] = useState<string | null>(null)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const handleCreateMarket = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }

    // Check if we're on Sepolia
    if (chainId !== sepolia.id) {
      toast.error('Please switch to Sepolia network')
      try {
        await switchChain({ chainId: sepolia.id })
        toast.success('Switched to Sepolia!')
        // Wait a moment for the switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Failed to switch network:', error)
        return
      }
    }

    setIsCreating(true)
    const loadingToast = toast.loading('Setting up Morpho market...')

    try {
      const id = await setupMorphoMarket(address as any)
      setMarketId(id)
      toast.success('Market created successfully!', { id: loadingToast })
      
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('morpho_market_id', id)
      }
    } catch (error: any) {
      console.error('Market creation failed:', error)
      
      // Handle specific error cases
      if (error.message?.includes('User rejected') || error.message?.includes('user cancel')) {
        toast.error('Transaction cancelled by user', { id: loadingToast })
      } else if (error.message?.includes('insufficient funds')) {
        toast.error('Insufficient funds for gas. Please add Sepolia ETH', { id: loadingToast })
      } else {
        toast.error(error.message || 'Failed to create market', { id: loadingToast })
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Check if market already exists
  const existingMarketId = typeof window !== 'undefined' 
    ? localStorage.getItem('morpho_market_id')
    : null

  if (existingMarketId || marketId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-green-800 font-semibold mb-2">Market Already Created</h3>
        <p className="text-green-700 text-sm">
          Market ID: <code className="bg-green-100 px-2 py-1 rounded">
            {(marketId || existingMarketId)?.slice(0, 10)}...
          </code>
        </p>
        <p className="text-green-600 text-xs mt-2">
          You can now use the lending features with this market.
        </p>
      </div>
    )
  }

  const isWrongNetwork = chainId !== sepolia.id

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-yellow-800 font-semibold mb-2">One-Time Market Setup Required</h3>
      
      {isWrongNetwork && isConnected && (
        <div className="bg-red-100 border border-red-300 rounded-md p-2 mb-4">
          <p className="text-red-700 text-sm font-medium">
            ⚠️ Wrong Network: Please switch to Sepolia (current: chain {chainId})
          </p>
        </div>
      )}
      
      <p className="text-yellow-700 text-sm mb-4">
        Before using Morpho lending, you need to deploy a wstETH/WETH market on Sepolia.
        This is a one-time setup that will:
      </p>
      <ol className="list-decimal list-inside text-yellow-700 text-sm mb-4 space-y-1">
        <li>Deploy a Chainlink oracle for wstETH/WETH price feed</li>
        <li>Create a lending market with 86% LTV</li>
        <li>Enable supply, borrow, and repay operations</li>
      </ol>
      
      <button
        onClick={handleCreateMarket}
        disabled={isCreating || !isConnected}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isCreating || !isConnected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        {!isConnected 
          ? 'Connect Wallet First'
          : isCreating 
            ? 'Creating Market...' 
            : 'Deploy Market on Sepolia'
        }
      </button>
      
      {isCreating && (
        <p className="text-yellow-600 text-xs mt-2 animate-pulse">
          Please confirm transactions in your wallet...
        </p>
      )}
    </div>
  )
}