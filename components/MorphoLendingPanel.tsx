'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { useMorphoPosition, useMorphoBalances, useMorphoMarket } from '@/hooks/useMorphoData'
import { useMorphoSupply, useMorphoBorrow } from '@/hooks/useMorphoTransactions'
import { useAutomation } from '@/contexts/AutomationContext'
import toast from 'react-hot-toast'
import { morphoClient } from '@/lib/morpho/client'
import type { Address } from 'viem'

export function MorphoLendingPanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: position, refetch: refetchPosition } = useMorphoPosition()
  const { data: balances, refetch: refetchBalances } = useMorphoBalances()
  const { data: market } = useMorphoMarket()
  const { supply, isLoading: isSupplying } = useMorphoSupply()
  const { borrow, isLoading: isBorrowing } = useMorphoBorrow()
  const { 
    autoBorrowEnabled, 
    toggleAutoBorrow, 
    canExecuteAction, 
    recordAction, 
    setProcessing 
  } = useAutomation()

  const [supplyAmount, setSupplyAmount] = useState('')
  const [borrowAmount, setBorrowAmount] = useState('')
  const [mode, setMode] = useState<'supply' | 'borrow' | 'manage'>('supply')
  const [useBundled, setUseBundled] = useState(false)
  const [autoCalcBorrow, setAutoCalcBorrow] = useState(false)
  const [showCreateMarket, setShowCreateMarket] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Fix hydration by ensuring client-only rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate max borrowable based on collateral
  const maxBorrowable = position?.maxBorrowable || 0
  const availableToBorrow = position?.availableToBorrow || 0
  const healthFactor = position?.healthFactor || 0

  // Auto-calculate borrow amount based on supply
  useEffect(() => {
    if (autoCalcBorrow && supplyAmount && mode === 'supply') {
      const supplyNum = parseFloat(supplyAmount)
      if (!isNaN(supplyNum) && supplyNum > 0) {
        // Calculate 80% of the collateral value in USDC
        const wstEthToEth = market?.oraclePrice || 1.15 // wstETH to ETH price
        const ethPrice = market?.ethPrice || 4500 // ETH to USD price from Chainlink
        const maxSafeBorrow = supplyNum * wstEthToEth * ethPrice * 0.8 // 80% of max 86% LTV for safety
        setBorrowAmount(maxSafeBorrow.toFixed(2))
      } else {
        setBorrowAmount('')
      }
    }
  }, [supplyAmount, autoCalcBorrow, market?.oraclePrice, mode])

  // Auto-execute bundled transaction if enabled
  useEffect(() => {
    if (autoBorrowEnabled && supplyAmount && borrowAmount && canExecuteAction('bundle')) {
      handleBundledTransaction(false)
    }
  }, [autoBorrowEnabled, supplyAmount, borrowAmount])

  const handleBundledTransaction = async (retryAsSequential = false) => {
    if (!address || !supplyAmount || !borrowAmount) {
      toast.error('Please fill in all amounts')
      return
    }

    // Validate amounts
    const supplyNum = parseFloat(supplyAmount)
    const borrowNum = parseFloat(borrowAmount)
    
    if (supplyNum <= 0 || borrowNum <= 0) {
      toast.error('Amounts must be positive')
      return
    }

    // Check if borrow amount is safe
    const wstEthToEth = market?.oraclePrice || 1.15
    const ethPrice = market?.ethPrice || 4500 // ETH to USD price from Chainlink
    const collateralValueUSD = supplyNum * wstEthToEth * ethPrice
    const maxSafeBorrow = collateralValueUSD * 0.8 // Leave some buffer below 86% LTV
    
    if (borrowNum > maxSafeBorrow) {
      toast.error(`Borrow amount too high. Max safe: ${maxSafeBorrow.toFixed(2)} USDC`)
      return
    }

    setProcessing(true)
    recordAction('bundle')
    const loadingToast = toast.loading('Executing bundled transaction...')

    try {
      if (useBundled && !retryAsSequential) {
        // Try bundled transaction
        await morphoClient.bundleSupplyAndBorrow(
          supplyAmount,
          borrowAmount,
          address as Address
        )
        toast.success('Supply and borrow successful!', { id: loadingToast })
      } else {
        // Fallback to sequential transactions
        toast.loading('Supplying collateral...', { id: loadingToast })
        await supply(supplyAmount)
        
        toast.loading('Borrowing USDC...', { id: loadingToast })
        await borrow(borrowAmount)
        
        toast.success('Transactions complete!', { id: loadingToast })
      }
      
      // Reset form and refresh data
      setSupplyAmount('')
      setBorrowAmount('')
      refetchPosition()
      refetchBalances()
    } catch (error: any) {
      console.error('Transaction failed:', error)
      
      // If bundled failed, try sequential
      if (useBundled && !retryAsSequential) {
        toast.error('Bundled transaction failed, trying sequential...', { id: loadingToast })
        setUseBundled(false)
        // Retry with sequential
        handleBundledTransaction(true)
      } else {
        toast.error(error.message || 'Transaction failed', { id: loadingToast })
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleSupplyOnly = async () => {
    if (!supplyAmount || !address) return
    
    try {
      await supply(supplyAmount)
      setSupplyAmount('')
      refetchPosition()
      refetchBalances()
    } catch (error) {
      console.error('Supply failed:', error)
    }
  }

  const handleBorrowOnly = async () => {
    if (!borrowAmount || !address) return
    
    // Check if we have available borrowing capacity instead of health factor
    if (availableToBorrow <= 0) {
      toast.error('No borrowing capacity available. Please supply more collateral.')
      return
    }
    
    // Check if borrow amount exceeds available
    if (parseFloat(borrowAmount) > availableToBorrow) {
      toast.error(`Cannot borrow more than $${availableToBorrow.toFixed(2)} USDC`)
      return
    }
    
    try {
      await borrow(borrowAmount)
      setBorrowAmount('')
      refetchPosition()
      refetchBalances()
    } catch (error) {
      console.error('Borrow failed:', error)
    }
  }

  // Prevent hydration mismatch by rendering consistently on server and client
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <div>Loading...</div>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500">
          <div>Please connect your wallet</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('supply')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'supply'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Supply
        </button>
        <button
          onClick={() => setMode('borrow')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'borrow'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Borrow
        </button>
        <button
          onClick={() => setMode('manage')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            mode === 'manage'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Manage
        </button>
      </div>

      {/* Position Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-700 font-medium">Collateral</p>
            <p className="font-bold text-lg text-gray-900">
              {position?.collateralBalance?.toFixed(4) || '0.0000'} <span className="text-sm font-normal text-gray-600">wstETH</span>
            </p>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Borrowed</p>
            <p className="font-bold text-lg text-gray-900">
              {position?.borrowedBalance?.toFixed(2) || '0.00'} <span className="text-sm font-normal text-gray-600">USDC</span>
            </p>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Health Factor</p>
            <p className={`font-bold text-lg ${
              healthFactor === 0 ? 'text-gray-400' :
              healthFactor > 1.5 ? 'text-green-600' : 
              healthFactor > 1.2 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {healthFactor === 0 ? '—' : healthFactor.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Available to Borrow</p>
            <p className="font-bold text-lg text-gray-900">
              {availableToBorrow?.toFixed(2) || '0.00'} <span className="text-sm font-normal text-gray-600">USDC</span>
            </p>
          </div>
        </div>
      </div>

      {/* Supply & Borrow Form */}
      {mode === 'supply' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Supply wstETH
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={supplyAmount}
                onChange={(e) => setSupplyAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setSupplyAmount(balances?.wstETH.toString() || '')}
                className="px-4 py-2.5 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                MAX
              </button>
            </div>
            <p className="text-sm text-gray-700 mt-2 font-medium">
              Balance: <span className="font-bold text-gray-900">{balances?.wstETH?.toFixed(4) || '0.0000'}</span> wstETH
            </p>
          </div>

          {/* Visual Calculation Indicator */}
          {supplyAmount && parseFloat(supplyAmount) > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Collateral Value:</span>
                <span className="font-bold text-gray-900">
                  {(parseFloat(supplyAmount) * (market?.oraclePrice || 1.15)).toFixed(4)} ETH
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-700">Max Safe Borrow (80% LTV):</span>
                <span className="font-bold text-blue-600">
                  ${(parseFloat(supplyAmount) * (market?.oraclePrice || 1.15) * (market?.ethPrice || 4500) * 0.8).toFixed(2)} USDC
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Then Borrow USDC
              {autoCalcBorrow && (
                <span className="ml-2 text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Auto-calculated at 80% LTV
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => {
                  setAutoCalcBorrow(false) // Disable auto-calc when user manually edits
                  setBorrowAmount(e.target.value)
                }}
                placeholder="Auto-calculated"
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
              />
              <button
                onClick={() => {
                  setAutoCalcBorrow(true)
                  const supplyNum = parseFloat(supplyAmount) || 0
                  const maxBorrow = supplyNum * (market?.oraclePrice || 1.1) * 0.8
                  setBorrowAmount(maxBorrow.toFixed(4))
                }}
                className="px-4 py-2.5 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Reset to 80% of collateral value"
              >
                Auto
              </button>
            </div>
            <div className="flex items-start gap-2 mt-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-gray-700">
                {autoCalcBorrow ? 
                  "Automatically set to 80% of your collateral value for safety" : 
                  "Manually adjusted - click 'Auto' to recalculate safe amount"}
              </p>
            </div>
          </div>

          {/* Auto-Borrow Toggle */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div>
              <p className="font-semibold text-gray-900">Auto-Borrow</p>
              <p className="text-sm text-gray-700 mt-1">Execute immediately on confirmation</p>
            </div>
            <button
              onClick={toggleAutoBorrow}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                autoBorrowEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  autoBorrowEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Supply Only Button */}
          <button
            onClick={handleSupplyOnly}
            disabled={isSupplying || !supplyAmount}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all shadow-md ${
              isSupplying || !supplyAmount
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg transform hover:scale-[1.02]'
            }`}
          >
            {isSupplying ? '🔄 Processing...' : '💎 Supply Collateral Only'}
          </button>
          
          {/* Info about borrowing later */}
          <p className="text-sm text-gray-600 text-center mt-2">
            Supply collateral first, then switch to Borrow tab to borrow USDC
          </p>
        </div>
      )}

      {mode === 'borrow' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Borrow USDC
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => setBorrowAmount(availableToBorrow.toFixed(4))}
                className="px-4 py-2.5 text-sm font-semibold bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                MAX
              </button>
            </div>
            <p className="text-sm text-gray-700 mt-2 font-medium">
              Available: <span className="font-bold text-gray-900">${availableToBorrow?.toFixed(2) || '0.00'}</span> USDC
            </p>
          </div>

          <button
            onClick={handleBorrowOnly}
            disabled={isBorrowing || !borrowAmount || availableToBorrow <= 0}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all shadow-md ${
              isBorrowing || !borrowAmount || availableToBorrow <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:scale-[1.02]'
            }`}
          >
            {isBorrowing ? '🔄 Borrowing...' : '💰 Borrow USDC'}
          </button>
        </div>
      )}

      {mode === 'manage' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Position Management</h3>
              <p className="text-gray-700">Repay loans and withdraw collateral features coming soon</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}