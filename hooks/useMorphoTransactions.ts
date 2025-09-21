'use client'

import { useState, useCallback } from 'react'
import { morphoClient } from '@/lib/morpho/client'
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import toast from 'react-hot-toast'
import type { Address } from 'viem'

interface TransactionState {
  isLoading: boolean
  error: string | null
  txHash: string | null
}

export function useMorphoSupply() {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null
  })
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()

  const supply = useCallback(async (amount: string) => {
    if (!address || !walletClient) {
      toast.error('Wallet not connected')
      return
    }

    // Switch to mainnet if not already on it
    if (walletClient.chain?.id !== mainnet.id) {
      toast.loading('Switching to Ethereum Mainnet...')
      try {
        await switchChain({ chainId: mainnet.id })
        // Wait a bit for the switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        toast.error('Please switch to Ethereum Mainnet in your wallet')
        return
      }
    }

    setState({ isLoading: true, error: null, txHash: null })
    const loadingToast = toast.loading('Supplying collateral...')

    try {
      const txHash = await morphoClient.supplyCollateralWithClient(amount, address as Address, walletClient)
      setState({ isLoading: false, error: null, txHash })
      toast.success('Collateral supplied successfully!', { id: loadingToast })
      return txHash
    } catch (error: any) {
      const errorMsg = error.message || 'Supply transaction failed'
      setState({ isLoading: false, error: errorMsg, txHash: null })
      toast.error(errorMsg, { id: loadingToast })
      throw error
    }
  }, [address, walletClient, switchChain])

  return { ...state, supply }
}

export function useMorphoBorrow() {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null
  })
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()

  const borrow = useCallback(async (amount: string) => {
    if (!address || !walletClient) {
      toast.error('Wallet not connected')
      return
    }

    // Switch to mainnet if not already on it
    if (walletClient.chain?.id !== mainnet.id) {
      toast.loading('Switching to Ethereum Mainnet...')
      try {
        await switchChain({ chainId: mainnet.id })
        // Wait a bit for the switch to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        toast.error('Please switch to Ethereum Mainnet in your wallet')
        return
      }
    }

    setState({ isLoading: true, error: null, txHash: null })
    const loadingToast = toast.loading('Borrowing assets...')

    try {
      const txHash = await morphoClient.borrowAssetWithClient(amount, address as Address, walletClient)
      setState({ isLoading: false, error: null, txHash })
      toast.success('Assets borrowed successfully!', { id: loadingToast })
      return txHash
    } catch (error: any) {
      const errorMsg = error.message || 'Borrow transaction failed'
      setState({ isLoading: false, error: errorMsg, txHash: null })
      toast.error(errorMsg, { id: loadingToast })
      throw error
    }
  }, [address, walletClient, switchChain])

  return { ...state, borrow }
}

export function useMorphoRepay() {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null
  })
  const { address } = useAccount()

  const repay = useCallback(async (amount: string) => {
    if (!address) {
      toast.error('Wallet not connected')
      return
    }

    setState({ isLoading: true, error: null, txHash: null })
    const loadingToast = toast.loading('Repaying loan...')

    try {
      const txHash = await morphoClient.repay(amount, address as Address)
      setState({ isLoading: false, error: null, txHash })
      toast.success('Loan repaid successfully!', { id: loadingToast })
      return txHash
    } catch (error: any) {
      const errorMsg = error.message || 'Repay transaction failed'
      setState({ isLoading: false, error: errorMsg, txHash: null })
      toast.error(errorMsg, { id: loadingToast })
      throw error
    }
  }, [address])

  return { ...state, repay }
}