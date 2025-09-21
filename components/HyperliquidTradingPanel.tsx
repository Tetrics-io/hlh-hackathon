'use client'

import { useState } from 'react'
import { useHyperliquidTrading } from '@/hooks/useHyperliquidTrading'
import { useHypeMarkPrice, useHyperliquidBalance } from '@/hooks/useHyperliquidData'
import { formatUnits } from 'viem'

export function HyperliquidTradingPanel() {
  const { buyHype, sellHype, isLoading } = useHyperliquidTrading()
  const { price: markPrice } = useHypeMarkPrice()
  const { balance: usdcBalance } = useHyperliquidBalance()
  
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market')
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [size, setSize] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  
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
      
      if (side === 'buy') {
        await buyHype(orderSize, price, false)
      } else {
        await sellHype(orderSize, price, false)
      }
    } else {
      // Market order
      if (side === 'buy') {
        await buyHype(orderSize, undefined, true)
      } else {
        await sellHype(orderSize, undefined, true)
      }
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
        <h2 className="text-xl font-bold mb-2">Trade HYPE Perpetual</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Mark Price:</span>
            <span className="ml-2 font-semibold text-green-400">${markPrice.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-gray-400">USDC Balance:</span>
            <span className="ml-2 font-semibold text-blue-400">{usdcBalance.toFixed(2)}</span>
          </div>
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
            Buy
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
            Sell
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
            placeholder="0.0"
            step="0.01"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
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
              placeholder={markPrice.toFixed(2)}
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
            <span className="font-semibold">${estimatedCost()} USDC</span>
          </div>
          {side === 'buy' && parseFloat(estimatedCost()) > usdcBalance && (
            <p className="text-red-500 text-xs mt-1">Insufficient USDC balance</p>
          )}
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (side === 'buy' && parseFloat(estimatedCost()) > usdcBalance)}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            side === 'buy'
              ? 'bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300'
          }`}
        >
          {isLoading ? 'Processing...' : `${side === 'buy' ? 'Buy' : 'Sell'} HYPE`}
        </button>
      </form>
      
      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-300">
        <p className="font-semibold mb-1">Trading Info:</p>
        <ul className="space-y-1">
          <li>• Market orders execute immediately at best available price</li>
          <li>• Limit orders execute only at your specified price or better</li>
          <li>• Trading fees apply to all orders</li>
          <li>• This is perpetual trading (not spot)</li>
        </ul>
      </div>
    </div>
  )
}