import { createWalletClient, createPublicClient, custom, http, type Address, parseUnits } from 'viem'
import { baseSepolia, BASE_SEPOLIA_ADDRESSES } from '@/lib/chains/base-sepolia'

const MORPHO_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'loanToken', type: 'address' },
          { name: 'collateralToken', type: 'address' },
          { name: 'oracle', type: 'address' },
          { name: 'irm', type: 'address' },
          { name: 'lltv', type: 'uint256' }
        ],
        name: 'marketParams',
        type: 'tuple'
      }
    ],
    name: 'createMarket',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export async function createBaseSepoliaMarket(userAddress: Address) {
  if (!window.ethereum) throw new Error('No wallet connected')
  
  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(window.ethereum),
    account: userAddress
  })
  
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http('https://sepolia.base.org')
  })
  
  const marketParams = {
    loanToken: BASE_SEPOLIA_ADDRESSES.WETH as Address,
    collateralToken: BASE_SEPOLIA_ADDRESSES.WSTETH as Address,
    oracle: '0x0000000000000000000000000000000000000000' as Address,
    irm: BASE_SEPOLIA_ADDRESSES.ADAPTIVE_IRM as Address,
    lltv: parseUnits('0.86', 18)
  }
  
  console.log('Creating Base Sepolia market with params:', marketParams)
  
  try {
    const tx = await walletClient.writeContract({
      address: BASE_SEPOLIA_ADDRESSES.MORPHO_BLUE as Address,
      abi: MORPHO_ABI,
      functionName: 'createMarket',
      args: [marketParams]
    })
    
    console.log('Market creation tx:', tx)
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
    console.log('Market created successfully on Base Sepolia:', receipt)
    
    // The market ID is deterministic
    const marketId = '0xd529c3d3d5589529962070000ea659c1a6a53d26ddeebdbe6e586113d5a95916'
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('base_morpho_market_id', marketId)
      localStorage.setItem('base_morpho_oracle_address', marketParams.oracle)
    }
    
    return { marketId, tx }
  } catch (error) {
    console.error('Failed to create market:', error)
    throw error
  }
}