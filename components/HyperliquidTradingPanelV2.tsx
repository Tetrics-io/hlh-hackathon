'use client'

import { useState, useEffect } from 'react'
import { useHyperliquidTradingV2 } from '@/hooks/useHyperliquidTradingV2'
import { useHypeMarkPrice, useHyperliquidBalance } from '@/hooks/useHyperliquidData'

export function HyperliquidTradingPanelV2() {
  const { placeLimitOrder, placeMarketOrder, isLoading } = useHyperliquidTradingV2()
  const { price: markPrice } = useHypeMarkPrice(5000) 
  const { balance: usdcBalance } = useHyperliquidBalance(10000)
  
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [size, setSize] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  
  // Load saved key from localStorage (for demo only)
  useEffect(() => {
    const savedKey = localStorage.getItem('hl_demo_key')
    if (savedKey) {
      setPrivateKey(savedKey)
    }
  }, [])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!privateKey) {
      alert('Please enter your private key')
      return
    }
    
    const orderSize = parseFloat(size)
    if (isNaN(orderSize) || orderSize <= 0) {
      alert('Invalid order size')
      return
    }
    
    // Save key for convenience (demo only - never do this in production!)
    localStorage.setItem('hl_demo_key', privateKey)
    
    if (orderType === 'limit') {
      const price = parseFloat(limitPrice)
      if (isNaN(price) || price <= 0) {
        alert('Invalid limit price')
        return
      }
      
      await placeLimitOrder(privateKey, side === 'buy', price, orderSize)
    } else {
      await placeMarketOrder(privateKey, side === 'buy', orderSize)
    }
    
    // Clear form
    setSize('')
    setLimitPrice('')
  }
  
  const estimatedCost = () => {
    const s = parseFloat(size) || 0
    const p = orderType === 'limit' ? parseFloat(limitPrice) || 0 : markPrice
    return (s * p).toFixed(2)
  }
  
  return (
    <div className="bg-gray-900 rounded-lg shadow-md p-6 text-white">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Trade HYPE Perpetual</h2>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
        
        {/* Private Key Input */}
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded">
          <label className="block text-sm font-medium text-red-400 mb-2">
            Private Key (Testnet Only - Never share real keys!)
          </label>
          <div className="relative">
            <input
              type={showPrivateKey ? 'text' : 'password'}
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              placeholder="Enter testnet private key..."
              className="w-full px-3 py-2 pr-20 bg-gray-800 border border-red-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-xs"
            />
            <button
              type="button"
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              {showPrivateKey ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="text-xs text-red-400 mt-1">
            ⚠️ This is for demo purposes only. Never enter real private keys!
          </p>
        </div>
      </div>
      
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
            !privateKey ||
            (side === 'buy' && parseFloat(estimatedCost()) > usdcBalance)
          }
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            side === 'buy'
              ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-700 disabled:text-gray-500'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-700 disabled:text-gray-500'
          }`}
        >
          {isLoading ? 'Processing...' : `${side === 'buy' ? 'Buy / Long' : 'Sell / Short'} HYPE`}
        </button>
      </form>
      
      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded text-xs text-blue-300">
        <p className="font-semibold mb-1">Important Notes:</p>
        <ul className="space-y-1">
          <li>• This is TESTNET trading only</li>
          <li>• You need a funded testnet account</li>
          <li>• Market orders use 1% slippage tolerance</li>
          <li>• Min order size: 0.001 HYPE</li>
          <li>• Your testnet address: 0xb5fD7F87414e97126d118c060041577EC16049EB</li>
        </ul>
      </div>
    </div>
  )
}