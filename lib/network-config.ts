export type NetworkType = 'testnet' | 'mainnet'

export interface NetworkConfig {
  // Hyperliquid
  hyperliquidApiUrl: string
  
  // Morpho Blue
  morphoBlueAddress: string
  wstETHAddress: string
  usdcAddress: string
  oracleAddress: string
  marketId: string
  
  // RPC URLs
  ethereumRpc: string
  arbitrumRpc: string
  hyperEvmRpc: string
  
  // Oracle prices (simplified for now)
  wstETHPrice: number
  
  // Network display info
  displayName: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    // Hyperliquid Testnet
    hyperliquidApiUrl: 'https://api.hyperliquid-testnet.xyz',
    
    // Morpho Blue (Using Mainnet for testing)
    morphoBlueAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
    wstETHAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    oracleAddress: '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2',
    marketId: '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
    
    // RPC URLs (Morpho on mainnet, Hyperliquid on testnet)
    ethereumRpc: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    arbitrumRpc: process.env.NEXT_PUBLIC_ARB_TESTNET_RPC || 'https://arbitrum-sepolia-rpc.publicnode.com',
    hyperEvmRpc: 'https://api.hyperliquid-testnet.xyz/evm',
    
    // Oracle price
    wstETHPrice: 4500, // Mainnet price approximation
    
    // Display info
    displayName: 'TESTNET',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
    icon: '🧪'
  },
  
  mainnet: {
    // Hyperliquid
    hyperliquidApiUrl: 'https://api.hyperliquid.xyz',
    
    // Morpho Blue (Ethereum)
    morphoBlueAddress: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
    wstETHAddress: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    oracleAddress: '0x48F7E36EB6B826B2dF4B2E630B62Cd25e89E40e2',
    marketId: '0xb323495f7e4148be5643a4ea4a8221eef163e4bccfdedc2a6f4696baacbc86cc',
    
    // RPC URLs (Hardcoded for mainnet)
    ethereumRpc: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    arbitrumRpc: 'https://arb-mainnet.g.alchemy.com/v2/demo',
    hyperEvmRpc: 'https://api.hyperliquid.xyz/evm',
    
    // Oracle price
    wstETHPrice: 4500, // Actual mainnet price approximation
    
    // Display info
    displayName: 'MAINNET',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
    icon: '🌐'
  }
}

// Helper function to get config
export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return NETWORK_CONFIGS[network]
}

// Default network - HARDCODED TO MAINNET
export const DEFAULT_NETWORK: NetworkType = 'mainnet'