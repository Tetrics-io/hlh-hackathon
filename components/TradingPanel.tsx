'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useApproveBuilder, usePlaceHypeIOC } from '@/hooks/useCoreWriter'
import { formatE8, toE8, isValidE8Input } from '@/lib/utils/conversion'
import { hyperEVM } from '@/lib/config'
import { useHyperliquidData } from '@/hooks/useHyperliquidData'

export function TradingPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [mounted, setMounted] = useState(false)
  
  // Hyperliquid data polling
  const { balance, hypeMarkPrice, lastUpdate } = useHyperliquidData(5000) // Poll every 5 seconds
  
  // Builder approval state
  const [builderAddress, setBuilderAddress] = useState('')
  const [feeRate, setFeeRate] = useState('100') // Default 0.1%
  
  // Trading state
  const [isBuy, setIsBuy] = useState(true)
  const [price, setPrice] = useState('10') // Default $10 for HYPE
  const [size, setSize] = useState('1') // Default 1 HYPE
  
  // Hooks
  const { approveBuilder, isLoading: isApprovingBuilder } = useApproveBuilder()
  const { placeHypeOrder, isLoading: isPlacingOrder } = usePlaceHypeIOC()
  
  // Ensure component is mounted before checking connection states
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Check if connected to HyperEVM
  const isCorrectChain = chainId === hyperEVM.id
  
  // Show loading state until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading trading panel...</p>
        </div>
      </div>
    )
  }
  
  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">Please connect your wallet to trade</p>
      </div>
    )
  }
  
  if (!isCorrectChain) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-gray-600 text-center">Please switch to HyperEVM network</p>
      </div>
    )
  }
  
  const handleApproveBuilder = () => {
    if (!builderAddress) {
      alert('Please enter a builder address')
      return
    }
    approveBuilder(builderAddress, parseInt(feeRate))
  }
  
  const handlePlaceOrder = () => {
    if (!isValidE8Input(price) || !isValidE8Input(size)) {
      alert('Please enter valid price and size')
      return
    }
    placeHypeOrder(isBuy, price, size)
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Hyperliquid Trading Panel</h2>
        <p className="text-sm text-gray-600 mt-1">Trade with bridged USDC from Morpho</p>
        
        {/* Balance and Price Display */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-md p-3">
            <p className="text-xs font-medium text-blue-700">USDC Balance (HL)</p>
            <p className="text-lg font-bold text-blue-900">
              ${balance.toFixed(2)}
            </p>
            {balance > 0 && (
              <p className="text-xs text-green-600 mt-1">✓ Trading Enabled</p>
            )}
          </div>
          <div className="bg-purple-50 rounded-md p-3">
            <p className="text-xs font-medium text-purple-700">HYPE Mark Price</p>
            <p className="text-lg font-bold text-purple-900">
              ${hypeMarkPrice.toFixed(2)}
            </p>
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Builder Approval Section */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 1: Approve Builder (Enable Gasless Trading)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Builder Address
            </label>
            <input
              type="text"
              value={builderAddress}
              onChange={(e) => setBuilderAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Fee Rate (DeciBps) - Max: 10000 (10%)
            </label>
            <input
              type="number"
              value={feeRate}
              onChange={(e) => setFeeRate(e.target.value)}
              placeholder="100"
              min="0"
              max="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Current: {(parseInt(feeRate) / 10000 * 100).toFixed(2)}% fee
            </p>
          </div>
          
          <button
            onClick={handleApproveBuilder}
            disabled={isApprovingBuilder || !builderAddress}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isApprovingBuilder ? 'Approving...' : 'Approve Builder'}
          </button>
        </div>
      </div>
      
      {/* Trading Section */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 2: Trade HYPE-PERP (Asset ID: 135)
        </h3>
        
        <div className="space-y-4">
          {/* Buy/Sell Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsBuy(true)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                isBuy 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setIsBuy(false)}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                !isBuy 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Sell
            </button>
          </div>
          
          {/* Size Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size (HYPE)
            </label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="1.00"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              E8 Value: {isValidE8Input(size) ? toE8(size).toString() : '0'}
            </p>
          </div>
          
          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit Price (USD)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10.00"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              E8 Value: {isValidE8Input(price) ? toE8(price).toString() : '0'}
            </p>
          </div>
          
          {/* Order Summary */}
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">Order Summary:</p>
            <p className="text-xs text-gray-600 mt-1">
              {isBuy ? 'Buy' : 'Sell'} {size} HYPE at ${price} each
            </p>
            <p className="text-xs text-gray-600">
              Total: ${(parseFloat(size) * parseFloat(price)).toFixed(2)} USDC
            </p>
            <p className="text-xs text-gray-500 mt-1">
              IOC (Immediate or Cancel) - Fills immediately or cancels
            </p>
          </div>
          
          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !price || !size || balance <= 0}
            className={`w-full px-4 py-3 rounded-md font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isBuy 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isPlacingOrder 
              ? 'Placing Order...' 
              : balance <= 0
              ? 'Insufficient Balance'
              : `Place ${isBuy ? 'Buy' : 'Sell'} IOC Order`
            }
          </button>
        </div>
      </div>
      
      {/* Info Section */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-900">How it works:</h4>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>1. Approve a builder to enable gasless trading on Hyperliquid</li>
            <li>2. Place IOC orders that execute immediately at your limit price or better</li>
            <li>3. Orders are settled with your bridged USDC from Morpho</li>
            <li>4. HYPE has 2 decimal places, max leverage is 10x</li>
          </ul>
        </div>
      </div>
    </div>
  )
}