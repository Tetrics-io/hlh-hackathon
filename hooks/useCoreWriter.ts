'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { toast } from 'react-hot-toast'
import { 
  CORE_WRITER_HELPER_ABI, 
  CORE_WRITER_HELPER_ADDRESS,
  HYPE_ASSET_ID 
} from '@/lib/contracts/CoreWriterHelper'
import { toE8 } from '@/lib/utils/conversion'
import { useCallback } from 'react'
import type { Address } from 'viem'

/**
 * Hook for approving builder fees on Hyperliquid
 */
export function useApproveBuilder() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approveBuilder = useCallback(
    async (builderAddress: string, maxFeeDeciBps: number) => {
      if (!builderAddress || !maxFeeDeciBps) {
        toast.error('Please provide builder address and fee rate')
        return
      }

      if (maxFeeDeciBps > 10000) {
        toast.error('Fee rate cannot exceed 10000 (10%)')
        return
      }

      if (!CORE_WRITER_HELPER_ADDRESS || CORE_WRITER_HELPER_ADDRESS === '0x') {
        toast.error('Contract not deployed yet. Please deploy the contract first.')
        return
      }

      try {
        writeContract({
          address: CORE_WRITER_HELPER_ADDRESS as Address,
          abi: CORE_WRITER_HELPER_ABI,
          functionName: 'approveBuilderFee',
          args: [builderAddress as Address, BigInt(maxFeeDeciBps)],
        })
        
        toast.loading('Approving builder...', { id: 'approve-builder' })
      } catch (err) {
        console.error('Error approving builder:', err)
        toast.error('Failed to approve builder')
      }
    },
    [writeContract]
  )

  // Handle success
  if (isSuccess) {
    toast.success('Builder approved successfully!', { id: 'approve-builder' })
  }

  // Handle error
  if (error) {
    toast.error(`Error: ${error.message}`, { id: 'approve-builder' })
  }

  return {
    approveBuilder,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Hook for placing IOC orders on Hyperliquid
 */
export function usePlaceIOC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const placeIOC = useCallback(
    async (
      assetId: number,
      isBuy: boolean,
      price: number | string,
      size: number | string,
      reduceOnly: boolean = false
    ) => {
      if (!price || !size) {
        toast.error('Please provide price and size')
        return
      }

      if (!CORE_WRITER_HELPER_ADDRESS || CORE_WRITER_HELPER_ADDRESS === '0x') {
        toast.error('Contract not deployed yet. Please deploy the contract first.')
        return
      }

      try {
        const priceE8 = toE8(price)
        const sizeE8 = toE8(size)

        if (priceE8 <= 0 || sizeE8 <= 0) {
          toast.error('Price and size must be positive')
          return
        }

        writeContract({
          address: CORE_WRITER_HELPER_ADDRESS as Address,
          abi: CORE_WRITER_HELPER_ABI,
          functionName: 'placeIoc',
          args: [assetId, isBuy, priceE8, sizeE8, reduceOnly],
        })
        
        const side = isBuy ? 'Buy' : 'Sell'
        toast.loading(`Placing ${side} IOC order...`, { id: 'place-ioc' })
      } catch (err) {
        console.error('Error placing IOC order:', err)
        toast.error('Failed to place IOC order')
      }
    },
    [writeContract]
  )

  // Handle success
  if (isSuccess) {
    toast.success('IOC order placed successfully!', { id: 'place-ioc' })
  }

  // Handle error
  if (error) {
    toast.error(`Error: ${error.message}`, { id: 'place-ioc' })
  }

  return {
    placeIOC,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Convenience hook for HYPE-PERP trading
 */
export function usePlaceHypeIOC() {
  const { placeIOC, ...rest } = usePlaceIOC()

  const placeHypeOrder = useCallback(
    async (isBuy: boolean, price: number | string, size: number | string = '1') => {
      await placeIOC(HYPE_ASSET_ID, isBuy, price, size, false)
    },
    [placeIOC]
  )

  return {
    placeHypeOrder,
    ...rest,
  }
}