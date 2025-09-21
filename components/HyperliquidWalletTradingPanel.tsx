'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useHyperliquidWalletTrading } from '@/hooks/useHyperliquidWalletTrading'
import { useHypeMarkPrice, useHyperliquidBalance } from '@/hooks/useHyperliquidData'

export function HyperliquidWalletTradingPanel() {
  const { address } = useAccount()
  const { placeLimitOrder, placeMarketOrder, approveBuilder, isLoading } = useHyperliquidWalletTrading()
  const { price: markPrice } = useHypeMarkPrice(5000) 
  const { balance: usdcBalance } = useHyperliquidBalance(10000)
  
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [size, setSize] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [showBuilderApproval, setShowBuilderApproval] = useState(false)
  const [builderAddress, setBuilderAddress] = useState('0xb5fD7F87414e97126d118c060041577EC16049EB')
  const [maxFeeRate, setMaxFeeRate] = useState('0.001')
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const orderSize = parseFloat(size)
    if (isNaN(orderSize) || orderSize <= 0) {
      alert('Invalid order size')
      return
    }
    
    if (orderType === 'limit') {
      const price = parseFloat(limitPrice)
      if (isNaN(price) || price <= 0) {
        alert('Invalid limit price')
        return
      }
      
      await placeLimitOrder(side === 'buy', price, orderSize)
    } else {
      await placeMarketOrder(side === 'buy', orderSize)
    }
    
    // Clear form
    setSize('')
    setLimitPrice('')
  }
  
  const handleApproveBuilder = async () => {
    if (!builderAddress) {
      alert('Please enter a builder address')
      return
    }
    
    const feeRateStr = `${maxFeeRate}%`
    await approveBuilder(builderAddress as `0x${string}`, feeRateStr)
    setShowBuilderApproval(false)
  }
  
  const estimatedCost = () => {
    const s = parseFloat(size) || 0
    const p = orderType === 'limit' ? parseFloat(limitPrice) || 0 : markPrice
    return (s * p).toFixed(2)
  }
  
  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6 text-white">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Trade HYPE Perpetual</h2>
        
        {/* Account Info */}
        <div className="bg-gray-800 rounded p-3 mb-4">
          <div className="text-xs text-gray-400 mb-1">Connected Account</div>
          <div className="font-mono text-sm text-blue-400">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Mark Price:</span>
            <span className="ml-2 font-semibold text-green-400">
              ${markPrice > 0 ? markPrice.toFixed(2) : '...'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">USDC Balance:</span>
            <span className="ml-2 font-semibold text-blue-400">
              {usdcBalance.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Builder Approval Toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowBuilderApproval(!showBuilderApproval)}
          className="text-xs text-yellow-400 hover:text-yellow-300 underline"
        >
          {showBuilderApproval ? 'Hide' : 'Show'} Builder Approval (Optional - For Gasless Trading)
        </button>
      </div>
      
      {/* Builder Approval Section */}
      {showBuilderApproval && (
        <div className="mb-6 p-4 bg-gray-800 rounded border border-gray-700">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">
            Approve Builder for Gasless Trading
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Builder Address
              </label>
              <input
                type="text"
                value={builderAddress}
                onChange={(e) => setBuilderAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use your own address for self-building
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Max Fee Rate (%)
              </label>
              <input
                type="number"
                value={maxFeeRate}
                onChange={(e) => setMaxFeeRate(e.target.value)}
                placeholder="0.001"
                step="0.001"
                min="0"
                max="10"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            <button
              onClick={handleApproveBuilder}
              disabled={isLoading || !builderAddress}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
            >
              Approve Builder
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Order Side */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSide('buy')}
            className={`py-2 px-4 rounded font-medium transition-colors ${
              side === 'buy'
                ? 'bg-green-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Buy / Long
          </button>
          <button
            type="button"
            onClick={() => setSide('sell')}
            className={`py-2 px-4 rounded font-medium transition-colors ${
              side === 'sell'
                ? 'bg-red-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sell / Short
          </button>
        </div>
        
        {/* Order Type */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`py-2 px-4 rounded text-sm font-medium transition-colors ${
              orderType === 'market'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Market Order
          </button>
          <button
            type="button"
            onClick={() => setOrderType('limit')}
            className={`py-2 px-4 rounded text-sm font-medium transition-colors ${
              orderType === 'limit'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Limit Order
          </button>
        </div>
        
        {/* Size Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Size (HYPE)
          </label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="0.01"
            step="0.001"
            min="0.001"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Min size: 0.001 HYPE
          </p>
        </div>
        
        {/* Limit Price (only for limit orders) */}
        {orderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Limit Price (USD)
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={markPrice > 0 ? markPrice.toFixed(2) : '0.00'}
              step="0.01"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        )}
        
        {/* Estimated Cost */}
        <div className="bg-gray-800 p-3 rounded border border-gray-700">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estimated Cost:</span>
            <span className="font-semibold text-yellow-400">
              ${estimatedCost()} USDC
            </span>
          </div>
          {side === 'buy' && parseFloat(estimatedCost()) > usdcBalance && (
            <p className="text-red-400 text-xs mt-1">
              ⚠️ Insufficient USDC balance
            </p>
          )}
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            isLoading || 
            !address ||
            (side === 'buy' && parseFloat(estimatedCost()) > usdcBalance)
          }
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            side === 'buy'
              ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-700 disabled:text-gray-500'
          }`}
        >
          {isLoading 
            ? 'Sign in Wallet...' 
            : !address
            ? 'Connect Wallet'
            : `${side === 'buy' ? 'Buy / Long' : 'Sell / Short'} HYPE`
          }
        </button>
      </form>
      
      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded text-xs text-blue-300">
        <p className="font-semibold mb-1">How it works:</p>
        <ul className="space-y-1">
          <li>✓ Sign orders with your connected wallet (MetaMask, etc)</li>
          <li>✓ No private keys needed - secure wallet signing</li>
          <li>✓ Optional: Approve builder for gasless trading</li>
          <li>✓ Trading on Hyperliquid testnet</li>
          <li>✓ Your address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</li>
        </ul>
      </div>
    </div>
  )
}