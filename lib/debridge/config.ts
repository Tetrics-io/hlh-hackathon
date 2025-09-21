/**
 * deBridge Widget Configuration for USDC Bridging
 */

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  ARBITRUM: 42161,
  ETHEREUM_GOERLI: 5,
  ARBITRUM_GOERLI: 421613,
} as const

// USDC Token Addresses
export const USDC_ADDRESSES = {
  // Mainnet
  ETHEREUM: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  ARBITRUM: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  
  // Testnet
  ETHEREUM_GOERLI: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F',
  ARBITRUM_GOERLI: '0x8FB1E3fC51F3b789dED7557E680551d93Ea9d892',
} as const

// deBridge Widget Default Configuration
export const DEFAULT_WIDGET_CONFIG = {
  // Widget container settings
  element: 'debridgeWidget',
  width: '100%',
  height: '600px',
  
  // Default chain configuration (Ethereum → Arbitrum)
  inputChain: CHAIN_IDS.ETHEREUM,
  outputChain: CHAIN_IDS.ARBITRUM,
  
  // Default token (USDC)
  inputCurrency: USDC_ADDRESSES.ETHEREUM,
  outputCurrency: USDC_ADDRESSES.ARBITRUM,
  
  // UI settings
  theme: 'light',
  lang: 'en',
  
  // Default amount (optional)
  amount: '100',
  
  // Hide certain elements (optional)
  hideInputChainSelect: false,
  hideOutputChainSelect: true, // Lock to Arbitrum/Hyperliquid route
  hideInputCurrencySelect: false,
  hideOutputCurrencySelect: true, // Lock to USDC
} as const

// Testnet configuration
export const TESTNET_WIDGET_CONFIG = {
  ...DEFAULT_WIDGET_CONFIG,
  inputChain: CHAIN_IDS.ETHEREUM_GOERLI,
  outputChain: CHAIN_IDS.ARBITRUM_GOERLI,
  inputCurrency: USDC_ADDRESSES.ETHEREUM_GOERLI,
  outputCurrency: USDC_ADDRESSES.ARBITRUM_GOERLI,
} as const

// Helper function to get config based on environment
export function getWidgetConfig(isTestnet: boolean = false) {
  return isTestnet ? TESTNET_WIDGET_CONFIG : DEFAULT_WIDGET_CONFIG
}

// Bridge status types
export type BridgeStatus = 'idle' | 'pending' | 'success' | 'error'

// Event types from deBridge widget
export interface DeBridgeOrder {
  orderId: string
  status: string
  fromChainId: number
  toChainId: number
  fromTokenAddress: string
  toTokenAddress: string
  fromAmount: string
  toAmount: string
  txHash?: string
}