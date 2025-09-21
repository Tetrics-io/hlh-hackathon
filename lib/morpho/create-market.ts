import { createWalletClient, createPublicClient, custom, http, type Address, parseUnits } from 'viem'
import { sepolia } from 'viem/chains'

const MORPHO_BLUE = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address
const WETH = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as Address
const WSTETH = '0xB82381A3fBD3FaFA77B3a7bE693342618240067b' as Address
const ADAPTIVE_IRM = '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC' as Address

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

export async function createMorphoMarket(userAddress: Address) {
  if (!window.ethereum) throw new Error('No wallet connected')
  
  const walletClient = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum),
    account: userAddress
  })
  
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http('https://sepolia.infura.io/v3/f61dc9821b2a439aa8c18b15fe37d310')
  })
  
  const marketParams = {
    loanToken: WETH,
    collateralToken: WSTETH,
    oracle: '0x0000000000000000000000000000000000000000' as Address,
    irm: ADAPTIVE_IRM,
    lltv: parseUnits('0.86', 18)
  }
  
  console.log('Creating market with params:', marketParams)
  
  try {
    const tx = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: MORPHO_ABI,
      functionName: 'createMarket',
      args: [marketParams]
    })
    
    console.log('Market creation tx:', tx)
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: tx })
    console.log('Market created successfully:', receipt)
    
    // The market ID is deterministic
    const marketId = '0x5579596ef4e22ea1f38a56c32256ad37963f628e7e4da219d40a1c737ac87dc6'
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('morpho_market_id', marketId)
      localStorage.setItem('morpho_oracle_address', marketParams.oracle)
    }
    
    return { marketId, tx }
  } catch (error) {
    console.error('Failed to create market:', error)
    throw error
  }
}