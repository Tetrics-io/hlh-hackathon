'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { NetworkType, DEFAULT_NETWORK, getNetworkConfig } from '@/lib/network-config'

interface NetworkContextType {
  network: NetworkType
  setNetwork: (network: NetworkType) => void
  config: ReturnType<typeof getNetworkConfig>
  isTestnet: boolean
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

const STORAGE_KEY = 'preferred-network'

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetworkState] = useState<NetworkType>(DEFAULT_NETWORK)
  const [mounted, setMounted] = useState(false)
  
  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'mainnet' || saved === 'testnet') {
      setNetworkState(saved)
    }
    setMounted(true)
  }, [])
  
  // Save preference when it changes
  const setNetwork = (newNetwork: NetworkType) => {
    setNetworkState(newNetwork)
    localStorage.setItem(STORAGE_KEY, newNetwork)
    
    // Show notification
    const message = `Switched to ${newNetwork === 'testnet' ? 'Testnet' : 'Mainnet'}`
    if (typeof window !== 'undefined' && window.alert) {
      // In production, you might want to use a toast notification instead
      console.log(message)
    }
  }
  
  const config = getNetworkConfig(network)
  const isTestnet = network === 'testnet'
  
  // Prevent hydration mismatch by using default values until mounted
  if (!mounted) {
    return (
      <NetworkContext.Provider value={{
        network: DEFAULT_NETWORK,
        setNetwork: () => {},
        config: getNetworkConfig(DEFAULT_NETWORK),
        isTestnet: DEFAULT_NETWORK === 'testnet'
      }}>
        {children}
      </NetworkContext.Provider>
    )
  }
  
  return (
    <NetworkContext.Provider value={{
      network,
      setNetwork,
      config,
      isTestnet
    }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const context = useContext(NetworkContext)
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider')
  }
  return context
}