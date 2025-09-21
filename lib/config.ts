import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum } from 'wagmi/chains'
import { defineChain } from 'viem'

// HyperEVM Chain Configuration
export const hyperEVM = defineChain({
  id: 998,
  name: 'Hyperliquid EVM',
  nativeCurrency: {
    name: 'Hyperliquid',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://api.hyperliquid.xyz/evm'] },
    public: { http: ['https://api.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Explorer', url: 'https://explorer.hyperliquid.xyz' },
  },
  testnet: false,
})

// HyperEVM Testnet Configuration (fallback)
export const hyperEVMTestnet = defineChain({
  id: 998_113,
  name: 'Hyperliquid Testnet',
  nativeCurrency: {
    name: 'Test HYPE',
    symbol: 'tHYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://api.hyperliquid-testnet.xyz/evm'] },
    public: { http: ['https://api.hyperliquid-testnet.xyz/evm'] },
  },
  blockExplorers: {
    default: { name: 'HyperEVM Testnet Explorer', url: 'https://testnet.explorer.hyperliquid.xyz' },
  },
  testnet: true,
})

// Hyperliquid Core Writer Address
export const HL_CORE_WRITER_ADDRESS = '0x3333333333333333333333333333333333333333' as const

// Wagmi Configuration
export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, hyperEVM],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [hyperEVM.id]: http(),
  },
})

// Export supported chains for UI
export const supportedChains = [
  { 
    id: mainnet.id, 
    name: mainnet.name,
    icon: '🟦'
  },
  { 
    id: arbitrum.id, 
    name: arbitrum.name,
    icon: '🔷'
  },
  { 
    id: hyperEVM.id, 
    name: hyperEVM.name,
    icon: '⚡'
  },
]