'use client'

import { useAccount, useBalance, useChainId } from 'wagmi'
import { formatEther } from 'viem'
import { supportedChains } from '@/lib/config'
import { useEffect, useState } from 'react'

export function ChainInfo() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: balance } = useBalance({
    address: address,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isConnected || !address) {
    return null
  }

  const currentChain = supportedChains.find(c => c.id === chainId)

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-900">Chain Information</h2>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Connected Chain:</span>
          <span className="font-semibold flex items-center gap-2 text-gray-900">
            {currentChain?.icon} {currentChain?.name || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Chain ID:</span>
          <code className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-900">
            {chainId}
          </code>
        </div>

        {balance && (
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Balance:</span>
            <span className="font-mono text-sm text-gray-900 font-semibold">
              {parseFloat(formatEther(balance.value)).toFixed(4)} {balance.symbol}
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Supported Chains:</h3>
          <div className="flex flex-wrap gap-2">
            {supportedChains.map((chain) => (
              <div
                key={chain.id}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  chain.id === chainId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                }`}
              >
                {chain.icon} {chain.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}