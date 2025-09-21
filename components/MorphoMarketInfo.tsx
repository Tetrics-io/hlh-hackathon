'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useNetwork } from '@/contexts/NetworkContext'
import { useMorphoMarket, useMorphoPosition, useMorphoBalances } from '@/hooks/useMorphoData'
import MorphoMarketSetup from './MorphoMarketSetup'

export function MorphoMarketInfo() {
  const { address, isConnected } = useAccount()
  const { isTestnet } = useNetwork()
  const [mounted, setMounted] = useState(false)
  
  // Use real hooks for data fetching
  const { data: marketData, isLoading: marketLoading, error: marketError } = useMorphoMarket()
  const { data: userPosition, isLoading: positionLoading } = useMorphoPosition()
  const { data: balances } = useMorphoBalances()
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    )
  }
  
  // Show market setup component if no market is configured
  if (!marketData && !marketLoading && !marketError) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Morpho Blue Market - Setup Required</h3>
        <MorphoMarketSetup />
      </div>
    )
  }
  
  if (marketError) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Morpho Blue Market</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">Error loading market data</p>
        </div>
      </div>
    )
  }
  
  const isLoading = marketLoading || positionLoading
  
  const getHealthFactorColor = (healthFactor: number): string => {
    if (healthFactor === 0) return 'text-gray-500'
    if (healthFactor > 1.5) return 'text-green-600'
    if (healthFactor > 1.2) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const formatHealthFactor = (healthFactor: number): string => {
    if (healthFactor === 0) return 'N/A'
    if (healthFactor > 100) return '∞'
    if (healthFactor < 1) return `⚠️ ${healthFactor.toFixed(2)}`
    return healthFactor.toFixed(2)
  }
  
  const healthFactorColor = userPosition 
    ? getHealthFactorColor(userPosition.healthFactor)
    : 'text-gray-500'
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Morpho Blue Market - wstETH/WETH {isTestnet && '(Sepolia)'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Supply wstETH as collateral, borrow WETH against it
        </p>
        {isTestnet && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠️ Using Sepolia testnet - create market if not already deployed
          </p>
        )}
      </div>
      
      {/* Market Parameters */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Market Parameters</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-600">Max LTV</p>
            <p className="text-lg font-bold text-gray-900">
              {marketData?.lltv || '86'}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-600">Supply APY</p>
            <p className="text-lg font-bold text-green-600">
              {marketData?.supplyAPY?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-600">Borrow APY</p>
            <p className="text-lg font-bold text-red-600">
              {marketData?.borrowAPY?.toFixed(2) || '0.00'}%
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-600">wstETH/ETH</p>
            <p className="text-lg font-bold text-gray-900">
              {marketData?.oraclePrice?.toFixed(3) || '1.100'}
            </p>
          </div>
        </div>
        
        {marketData && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Market ID: {marketData.marketId?.slice(0, 10)}...{marketData.marketId?.slice(-8)}</p>
          </div>
        )}
      </div>
      
      {/* User Position */}
      {isConnected && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Position</h4>
          
          {/* Wallet Balances */}
          {balances && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs font-medium text-gray-600">Wallet wstETH</p>
                <p className="text-sm font-semibold text-gray-900">
                  {balances.wstETH.toFixed(4)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs font-medium text-gray-600">Wallet WETH</p>
                <p className="text-sm font-semibold text-gray-900">
                  {balances.weth.toFixed(4)}
                </p>
              </div>
            </div>
          )}
          
          {userPosition ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-md p-3">
                  <p className="text-xs font-medium text-blue-700">Collateral (wstETH)</p>
                  <p className="text-lg font-bold text-blue-900">
                    {userPosition.collateralBalance.toFixed(4)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-md p-3">
                  <p className="text-xs font-medium text-purple-700">Borrowed (WETH)</p>
                  <p className="text-lg font-bold text-purple-900">
                    {userPosition.borrowedBalance.toFixed(4)} ETH
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs font-medium text-gray-700">Current LTV</p>
                  <p className="text-lg font-bold text-gray-900">
                    {userPosition.ltv.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-xs font-medium text-gray-700">Max Borrowable</p>
                  <p className="text-lg font-bold text-gray-900">
                    {userPosition.maxBorrowable.toFixed(4)} ETH
                  </p>
                </div>
              </div>
              
              {/* Health Factor */}
              <div className={`border-2 rounded-lg p-4 ${
                userPosition.healthFactor === 0 ? 'border-gray-200' :
                userPosition.healthFactor > 1.5 ? 'border-green-200 bg-green-50' :
                userPosition.healthFactor > 1.2 ? 'border-yellow-200 bg-yellow-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Health Factor</p>
                    <p className={`text-2xl font-bold ${healthFactorColor}`}>
                      {formatHealthFactor(userPosition.healthFactor)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      {userPosition.healthFactor === 0 ? 'No active position' :
                       userPosition.healthFactor > 1.5 ? 'Position is safe' :
                       userPosition.healthFactor > 1.2 ? 'Monitor position' :
                       'Risk of liquidation'}
                    </p>
                    {userPosition.healthFactor > 0 && userPosition.healthFactor < 1.2 && (
                      <p className="text-xs text-red-600 mt-1">
                        Liquidation at HF {'<'} 1.0
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Available Actions */}
              {userPosition.borrowedBalance > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h5 className="text-sm font-semibold text-blue-900 mb-2">Available Actions:</h5>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Bridge {userPosition.borrowedBalance.toFixed(4)} WETH via deBridge</li>
                    <li>• Add more wstETH collateral to improve Health Factor</li>
                    <li>• Repay part of your WETH loan to reduce risk</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600 text-center">
                {isLoading ? 'Loading position...' : 'No active position'}
              </p>
            </div>
          )}
        </div>
      )}
      
      {!isConnected && (
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              Connect your wallet to view your Morpho Blue position
            </p>
          </div>
        </div>
      )}
    </div>
  )
}