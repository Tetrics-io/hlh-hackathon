import { createWalletClient, createPublicClient, custom, http, type Address, parseUnits, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'

// Use the Re7 WETH/WETH market which exists on Sepolia
const MORPHO_BLUE = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb' as Address
const WETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' as Address // Sepolia WETH

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

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
      },
      { name: 'assets', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'data', type: 'bytes' }
    ],
    name: 'supply',
    outputs: [
      { name: 'assetsSupplied', type: 'uint256' },
      { name: 'sharesSupplied', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// Simple WETH/WETH market (Re7 Labs market on Sepolia)
const SIMPLE_MARKET = {
  loanToken: WETH,
  collateralToken: WETH,
  oracle: '0x0000000000000000000000000000000000000000' as Address,
  irm: '0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC' as Address,
  lltv: parseUnits('0.915', 18) // 91.5% LLTV
}

export async function simpleSupply(amount: string, userAddress: Address) {
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
  
  const amountWei = parseUnits(amount, 18)
  
  console.log('Simple supply to WETH/WETH market:', {
    market: SIMPLE_MARKET,
    amount,
    amountWei: amountWei.toString()
  })
  
  // Approve WETH
  const approveTx = await walletClient.writeContract({
    address: WETH,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [MORPHO_BLUE, amountWei]
  })
  
  await publicClient.waitForTransactionReceipt({ hash: approveTx })
  
  // Supply to market
  const supplyTx = await walletClient.writeContract({
    address: MORPHO_BLUE,
    abi: MORPHO_ABI,
    functionName: 'supply',
    args: [
      SIMPLE_MARKET,
      amountWei,
      0n,
      userAddress,
      '0x'
    ]
  })
  
  return supplyTx
}