'use client'

import { useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useMorphoPosition } from '@/hooks/useMorphoData'
import { useAutomation } from '@/contexts/AutomationContext'
import toast from 'react-hot-toast'

export function TransactionGuards() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: position } = useMorphoPosition()
  const { isProcessing } = useAutomation()
  
  // Monitor health factor
  useEffect(() => {
    if (!position) return
    
    const healthFactor = position.healthFactor || 0
    
    if (healthFactor > 0 && healthFactor < 1.0) {
      toast.error('⚠️ CRITICAL: Health factor below 1.0 - Liquidation risk!', {
        duration: 10000,
        position: 'top-center',
        style: {
          background: '#DC2626',
          color: 'white',
          fontWeight: 'bold'
        }
      })
    } else if (healthFactor > 0 && healthFactor < 1.2) {
      toast.error('Warning: Health factor low - Consider adding collateral', {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#F59E0B',
          color: 'white'
        }
      })
    }
  }, [position?.healthFactor])
  
  // Monitor processing state for stuck transactions
  useEffect(() => {
    if (!isProcessing) return
    
    const timeout = setTimeout(() => {
      toast.error('Transaction taking longer than expected...', {
        duration: 5000
      })
    }, 30000) // Alert after 30 seconds
    
    return () => clearTimeout(timeout)
  }, [isProcessing])
  
  // Monitor chain changes
  useEffect(() => {
    if (isConnected && chainId !== 11155111) { // Not on Sepolia
      toast.error('Please switch to Sepolia testnet for Morpho operations', {
        duration: 5000,
        position: 'top-center'
      })
    }
  }, [chainId, isConnected])
  
  // This component doesn't render anything, just monitors state
  return null
}