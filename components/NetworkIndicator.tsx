'use client'

import { useState } from 'react'
import { useNetwork } from '@/contexts/NetworkContext'

export function NetworkIndicator() {
  const { network, setNetwork, config, isTestnet } = useNetwork()
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      {/* Main Network Badge - Clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 transition-all hover:scale-105 cursor-pointer ${
          config.bgColor
        } border-2 ${config.borderColor} ${config.color}`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isTestnet ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
          <span>{config.icon} {config.displayName} MODE</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-16 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-2 z-50 min-w-[200px]">
          <div className="text-xs text-gray-600 mb-2 px-2">Select Network:</div>
          
          {/* Testnet Option */}
          <button
            onClick={() => {
              setNetwork('testnet')
              setIsOpen(false)
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
              network === 'testnet' 
                ? 'bg-yellow-100 text-yellow-800 font-semibold' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              network === 'testnet' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
            <span>🧪 Testnet</span>
            {network === 'testnet' && <span className="ml-auto">✓</span>}
          </button>
          
          {/* Mainnet Option */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to switch to Mainnet? This will use real funds.')) {
                setNetwork('mainnet')
                setIsOpen(false)
              }
            }}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
              network === 'mainnet' 
                ? 'bg-green-100 text-green-800 font-semibold' 
                : 'hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${
              network === 'mainnet' ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span>🌐 Mainnet</span>
            {network === 'mainnet' && <span className="ml-auto">✓</span>}
          </button>
          
          <div className="border-t mt-2 pt-2">
            <div className="text-xs text-gray-500 px-2">
              {isTestnet 
                ? 'Using test contracts and APIs' 
                : '⚠️ Real funds will be used'}
            </div>
          </div>
        </div>
      )}
      
      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}