#!/usr/bin/env node

import { createHyperliquidAPI } from '../lib/hyperliquid/api'

async function test() {
  const api = createHyperliquidAPI('https://api.hyperliquid-testnet.xyz', true)
  const address = '0xb5fD7F87414e97126d118c060041577EC16049EB'
  
  console.log('Testing Hyperliquid Testnet API for address:', address)
  console.log('-----------------------------------')
  
  // Test spot balances
  const spotBalances = await api.getUserSpotBalances(address)
  console.log('Spot Balances:', JSON.stringify(spotBalances, null, 2))
  
  // Test USDC balance
  const usdcBalance = await api.getUserBalance(address)
  console.log('USDC Balance:', usdcBalance)
  
  // Test HYPE mark price
  const hypePrice = await api.getHypeMarkPrice()
  console.log('HYPE Mark Price:', hypePrice)
  
  // Test perps account
  const accountSummary = await api.getUserAccountSummary(address)
  console.log('Perps Account:', JSON.stringify(accountSummary?.crossMarginSummary, null, 2))
}

test().catch(console.error)