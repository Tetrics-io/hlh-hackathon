'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { morphoAPI, type MorphoMarketData, type UserPositionData } from '@/lib/morpho/api'

export function MorphoMarketInfo() {
  const { address, isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [marketData, setMarketData] = useState<MorphoMarketData | null>(null)
  const [userPosition, setUserPosition] = useState<UserPositionData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    let isMounted = true
    
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch market data
        const market = await morphoAPI.getMarketData()
        if (isMounted) {
          setMarketData(market)
        }
        
        // Fetch user position if connected
        if (isConnected && address) {
          const position = await morphoAPI.getUserPosition(address)
          if (isMounted) {
            setUserPosition(position)
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch Morpho data')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [mounted, isConnected, address])
  
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
  
  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Morpho Blue Market</h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">Error loading market data: {error}</p>
        </div>
      </div>
    )
  }
  
  const healthFactorColor = userPosition 
    ? morphoAPI.constructor.getHealthFactorColor(userPosition.healthFactor)
    : 'text-gray-500'
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Morpho Blue Market - wstETH/USDC
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Supply wstETH as collateral, borrow USDC against it
        </p>
      </div>
      
      {/* Market Parameters */}
      <div className="p-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Market Parameters</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs font-medium text-gray-600">Max LTV</p>
            <p className="text-lg font-bold text-gray-900">
              {marketData?.lltv || '94.5'}%
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
            <p className="text-xs font-medium text-gray-600">Oracle Price</p>
            <p className="text-lg font-bold text-gray-900">
              $4,500
            </p>
          </div>
        </div>
        
        {marketData && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Market ID: {marketData.marketId.slice(0, 10)}...{marketData.marketId.slice(-8)}</p>
            <p>IRM: {marketData.irm.slice(0, 10)}...{marketData.irm.slice(-8)}</p>
          </div>
        )}
      </div>
      
      {/* User Position */}
      {isConnected && (
        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Position</h4>
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
                  <p className="text-xs font-medium text-purple-700">Borrowed (USDC)</p>
                  <p className="text-lg font-bold text-purple-900">
                    ${userPosition.borrowedBalance.toFixed(2)}
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
                    ${userPosition.maxBorrowable.toFixed(2)}
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
                      {morphoAPI.constructor.formatHealthFactor(userPosition.healthFactor)}
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
                    <li>• Bridge ${userPosition.borrowedBalance.toFixed(2)} USDC to Hyperliquid</li>
                    <li>• Add more collateral to improve Health Factor</li>
                    <li>• Repay part of your loan to reduce risk</li>
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