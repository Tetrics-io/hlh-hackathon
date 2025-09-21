'use client'

import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig, hyperEVM } from '@/lib/config'
import { mainnet, arbitrum } from 'wagmi/chains'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  
  return (
    <PrivyProvider
      appId="cm0wkgboh08mdfmczqr4e2say"
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#6366F1',
        },
        loginMethods: ['email', 'wallet', 'google', 'discord', 'twitter'],
        supportedChains: [mainnet, arbitrum, hyperEVM],
        defaultChain: mainnet,
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}