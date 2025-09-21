import { createPublicClient, createWalletClient, custom, http, type Address, parseUnits, encodeAbiParameters, keccak256 } from 'viem'
import { sepolia } from 'viem/chains'

// Declare window.ethereum type
declare global {
  interface Window {
    ethereum?: any
  }
}

// Sepolia Contract Addresses
const MORPHO_BLUE = process.env.NEXT_PUBLIC_MORPHO_BLUE_SEPOLIA as Address
const ADAPTIVE_IRM = process.env.NEXT_PUBLIC_ADAPTIVE_IRM_SEPOLIA as Address
const ORACLE_FACTORY = process.env.NEXT_PUBLIC_ORACLE_FACTORY_SEPOLIA as Address
const WSTETH = process.env.NEXT_PUBLIC_WSTETH_SEPOLIA as Address
const WETH = process.env.NEXT_PUBLIC_WETH_SEPOLIA as Address
const ETH_USD_FEED = process.env.NEXT_PUBLIC_ETH_USD_FEED_SEPOLIA as Address

// Morpho Blue ABI (minimal)
const MORPHO_BLUE_ABI = [
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
  },
  {
    inputs: [
      { name: 'id', type: 'bytes32' }
    ],
    name: 'market',
    outputs: [
      {
        components: [
          { name: 'totalSupplyAssets', type: 'uint128' },
          { name: 'totalSupplyShares', type: 'uint128' },
          { name: 'totalBorrowAssets', type: 'uint128' },
          { name: 'totalBorrowShares', type: 'uint128' },
          { name: 'lastUpdate', type: 'uint128' },
          { name: 'fee', type: 'uint128' }
        ],
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Oracle Factory ABI (minimal)
const ORACLE_FACTORY_ABI = [
  {
    inputs: [
      { name: 'baseFeed1', type: 'address' },
      { name: 'baseFeed2', type: 'address' },
      { name: 'quoteFeed1', type: 'address' },
      { name: 'quoteFeed2', type: 'address' },
      { name: 'baseVault', type: 'address' },
      { name: 'quoteVault', type: 'address' },
      { name: 'baseConversionFeed', type: 'uint256' },
      { name: 'quoteConversionFeed', type: 'uint256' },
      { name: 'baseTokenDecimals', type: 'uint256' },
      { name: 'quoteTokenDecimals', type: 'uint256' },
      { name: 'salt', type: 'bytes32' }
    ],
    name: 'createMorphoChainlinkOracleV2',
    outputs: [{ name: 'oracle', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

export interface MarketParams {
  loanToken: Address
  collateralToken: Address
  oracle: Address
  irm: Address
  lltv: bigint
}

/**
 * Calculate market ID from market parameters
 */
export function calculateMarketId(params: MarketParams): string {
  const encoded = encodeAbiParameters(
    [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'oracle', type: 'address' },
      { name: 'irm', type: 'address' },
      { name: 'lltv', type: 'uint256' }
    ],
    [params.loanToken, params.collateralToken, params.oracle, params.irm, params.lltv]
  )
  return keccak256(encoded)
}

/**
 * Deploy oracle for wstETH/WETH market using ChainlinkOracleV2Factory
 */
export async function deployOracle(walletClient: any): Promise<Address> {
  // For wstETH/WETH, we need to:
  // 1. Use ETH/USD feed for WETH pricing
  // 2. Use wstETH vault conversion for wstETH -> ETH conversion
  // 3. Compose them to get wstETH/WETH price
  
  try {
    const hash = await walletClient.writeContract({
      address: ORACLE_FACTORY,
      abi: ORACLE_FACTORY_ABI,
      functionName: 'createMorphoChainlinkOracleV2',
      args: [
        ETH_USD_FEED, // baseFeed1 - ETH/USD for WETH
        '0x0000000000000000000000000000000000000000', // baseFeed2 - not used
        ETH_USD_FEED, // quoteFeed1 - ETH/USD for wstETH (through conversion)
        '0x0000000000000000000000000000000000000000', // quoteFeed2 - not used
        '0x0000000000000000000000000000000000000000', // baseVault - no vault for WETH
        WSTETH, // quoteVault - wstETH contract for conversion
        0n, // baseConversionFeed - no conversion for WETH
        1n, // quoteConversionFeed - use vault conversion for wstETH
        18n, // baseTokenDecimals - WETH has 18 decimals
        18n, // quoteTokenDecimals - wstETH has 18 decimals
        keccak256(encodeAbiParameters([{ type: 'uint256' }], [BigInt(Date.now())])) // salt
      ],
      chain: sepolia
    })
    
    console.log('Oracle deployment tx:', hash)
    
    // Wait for transaction and get oracle address from events
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ETH_TESTNET_RPC || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
    })
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    // Extract oracle address from logs
    // The factory emits an event with the new oracle address
    const oracleAddress = receipt.logs[0]?.address || '0x0000000000000000000000000000000000000000'
    
    console.log('Oracle deployed at:', oracleAddress)
    return oracleAddress as Address
  } catch (error) {
    console.error('Failed to deploy oracle:', error)
    throw error
  }
}

/**
 * Create wstETH/WETH lending market on Morpho Blue
 */
export async function createMarket(
  walletClient: any,
  oracleAddress: Address,
  lltv: number = 86 // 86% default LLTV for testnet
): Promise<string> {
  const marketParams: MarketParams = {
    loanToken: WETH,
    collateralToken: WSTETH,
    oracle: oracleAddress,
    irm: ADAPTIVE_IRM,
    lltv: parseUnits(lltv.toString(), 16) // LLTV is expressed with 18 decimals, but we use 16 for percentage
  }
  
  try {
    const hash = await walletClient.writeContract({
      address: MORPHO_BLUE,
      abi: MORPHO_BLUE_ABI,
      functionName: 'createMarket',
      args: [marketParams],
      chain: sepolia
    })
    
    console.log('Market creation tx:', hash)
    
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.NEXT_PUBLIC_ETH_TESTNET_RPC || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
    })
    
    await publicClient.waitForTransactionReceipt({ hash })
    
    // Calculate and return market ID
    const marketId = calculateMarketId(marketParams)
    console.log('Market created with ID:', marketId)
    
    return marketId
  } catch (error) {
    console.error('Failed to create market:', error)
    throw error
  }
}

/**
 * Check if market exists by querying its state
 */
export async function checkMarketExists(marketId: string): Promise<boolean> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http()
  })
  
  try {
    const market = await publicClient.readContract({
      address: MORPHO_BLUE,
      abi: MORPHO_BLUE_ABI,
      functionName: 'market',
      args: [marketId as `0x${string}`]
    })
    
    // If market has any activity, it exists
    return market.lastUpdate > 0n
  } catch (error) {
    console.error('Error checking market:', error)
    return false
  }
}

/**
 * Full market setup flow
 */
export async function setupMorphoMarket(userAddress?: Address): Promise<string> {
  // Check if we have a wallet client
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet connected')
  }
  
  // Get accounts if not provided
  if (!userAddress) {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No account connected. Please connect your wallet.')
    }
    userAddress = accounts[0] as Address
  }
  
  const walletClient = createWalletClient({
    account: userAddress,
    chain: sepolia,
    transport: custom(window.ethereum)
  })
  
  // Check if market already exists in localStorage
  const existingMarketId = localStorage.getItem('morpho_market_id')
  if (existingMarketId) {
    const exists = await checkMarketExists(existingMarketId)
    if (exists) {
      console.log('Market already exists:', existingMarketId)
      return existingMarketId
    }
  }
  
  console.log('Setting up new Morpho market...')
  
  // Step 1: Deploy oracle
  console.log('Deploying oracle...')
  const oracleAddress = await deployOracle(walletClient)
  
  // Step 2: Create market
  console.log('Creating market...')
  const marketId = await createMarket(walletClient, oracleAddress)
  
  // Save market ID
  localStorage.setItem('morpho_market_id', marketId)
  localStorage.setItem('morpho_oracle_address', oracleAddress)
  
  return marketId
}