'use client'

import { useQuery } from '@tanstack/react-query'
import { morphoClient, type MorphoMarketData, type UserPositionData } from '@/lib/morpho/client'
import { useAccount } from 'wagmi'
import type { Address } from 'viem'

export function useMorphoMarket() {
  return useQuery<MorphoMarketData | null>({
    queryKey: ['morpho-market'],
    queryFn: async () => {
      const data = await morphoClient.getMarketData()
      return data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000,
    retry: 3,
    retryDelay: 1000
  })
}

export function useMorphoPosition() {
  const { address } = useAccount()
  
  return useQuery<UserPositionData | null>({
    queryKey: ['morpho-position', address],
    queryFn: async () => {
      if (!address) return null
      const position = await morphoClient.getUserPosition(address as Address)
      return position
    },
    enabled: !!address,
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000,
    retry: 3
  })
}

export function useMorphoBalances() {
  const { address } = useAccount()
  
  return useQuery<{ wstETH: number; usdc: number } | null>({
    queryKey: ['morpho-balances', address],
    queryFn: async () => {
      if (!address) return null
      const balances = await morphoClient.getUserBalances(address as Address)
      return balances
    },
    enabled: !!address,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 3
  })
}