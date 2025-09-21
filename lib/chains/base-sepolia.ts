import { defineChain } from 'viem'

export const baseSepolia = defineChain({
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
      webSocket: ['wss://sepolia.base.org'],
    },
    public: {
      http: ['https://sepolia.base.org'],
      webSocket: ['wss://sepolia.base.org'],
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
  },
  testnet: true,
})

// Contract addresses on Base Sepolia
export const BASE_SEPOLIA_ADDRESSES = {
  MORPHO_BLUE: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb',
  WETH: '0x4200000000000000000000000000000000000006',
  WSTETH: '0x0b7c80afa38775cee5518a7b7b7f61341c2d4a73',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  ADAPTIVE_IRM: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC',
} as const