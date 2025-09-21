# Morpho Blue Lending Interface

A modern, user-friendly web application for interacting with Morpho Blue lending protocol on Ethereum mainnet. Built with Next.js and optimized for the wstETH/USDC market.

## Overview

This application provides a streamlined interface for lending and borrowing on Morpho Blue, one of the most efficient lending protocols in DeFi. Users can:

- **Supply wstETH as collateral** - Deposit wrapped staked ETH to earn yield
- **Borrow USDC** - Access liquidity against your collateral
- **Manage positions** - Track your health factor and manage risk
- **One-click operations** - Simplified UX for complex DeFi interactions

## Key Features

### 🔒 Security First
- Non-custodial - Users maintain full control of their funds
- Battle-tested Morpho Blue protocol
- Chainlink price oracles for accurate valuations

### 💰 Efficient Lending
- **86% Loan-to-Value (LTV)** - Maximize capital efficiency
- **Dynamic interest rates** - Adaptive curve IRM adjusts to market conditions
- **Real-time position tracking** - Monitor collateral, borrows, and health factor

### 🎯 User Experience
- **Simple interface** - Clean, intuitive design
- **Wallet integration** - Seamless connection via Privy
- **Transaction status** - Real-time feedback on all operations
- **Mobile responsive** - Works on all devices

## Technical Architecture

### Smart Contracts
- **Morpho Blue**: Core lending protocol (`0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`)
- **Market ID**: wstETH/USDC market with 86% LLTV
- **Price Oracle**: Chainlink ETH/USD feed for accurate pricing

### Frontend Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Viem** - Ethereum interactions
- **Privy** - Wallet connection and authentication
- **TailwindCSS** - Responsive styling

### Key Dependencies
- `@morpho-org/blue-sdk-viem` - Official Morpho Blue SDK
- `@privy-io/react-auth` - Wallet authentication
- `viem` - Ethereum library
- `react-hot-toast` - Notifications

## Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Ethereum wallet (MetaMask, Coinbase Wallet, etc.)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd web3-app
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure `.env.local`:
```env
# Privy Configuration (required)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PRIVY_SECRET_KEY=your_privy_secret_key

# Network Configuration
NEXT_PUBLIC_USE_TESTNET=false

# RPC Endpoint (required)
NEXT_PUBLIC_ETHEREUM_RPC=https://mainnet.infura.io/v3/your_api_key
```

5. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Usage Guide

### Supplying Collateral
1. Connect your wallet
2. Enter the amount of wstETH to supply
3. Click "Supply" and approve the transaction
4. Your collateral will be deposited into Morpho Blue

### Borrowing USDC
1. Ensure you have supplied collateral
2. Enter the amount of USDC to borrow (up to your borrowing capacity)
3. Click "Borrow" and approve the transaction
4. USDC will be sent to your wallet

### Managing Your Position
- **Health Factor**: Keep above 1.0 to avoid liquidation
- **Available to Borrow**: Maximum USDC you can borrow based on collateral
- **Current APY**: Real-time interest rates for borrowing

### Repaying Loans
1. Enter the amount to repay
2. Click "Repay" and approve the transaction
3. Your borrowed balance will decrease

### Withdrawing Collateral
1. Ensure health factor remains safe after withdrawal
2. Enter withdrawal amount
3. Click "Withdraw" and approve the transaction

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_PRIVY_APP_ID`
   - `NEXT_PUBLIC_PRIVY_SECRET_KEY`
   - `NEXT_PUBLIC_ETHEREUM_RPC`
   - `NEXT_PUBLIC_USE_TESTNET` (set to `false`)
4. Deploy

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Market Parameters

The app is configured for the wstETH/USDC market on Morpho Blue:

- **Collateral**: wstETH (Wrapped Staked ETH)
- **Loan Asset**: USDC
- **Max LTV**: 86%
- **Liquidation LTV**: 91.5%
- **Interest Model**: Adaptive Curve IRM
- **Oracle**: Chainlink ETH/USD

## Security Considerations

- Always monitor your health factor to avoid liquidation
- Understand the risks of leveraged positions
- Price volatility can affect your collateral value
- Smart contracts are immutable - interactions are final

## Troubleshooting

### Common Issues

**Wallet Connection Issues**
- Ensure wallet is on Ethereum mainnet
- Clear browser cache and reconnect

**Transaction Failures**
- Check you have enough ETH for gas
- Verify token balances and allowances
- Ensure health factor is safe for operations

**RPC Errors**
- Verify your RPC endpoint is configured correctly
- Try alternative RPC providers if issues persist

## Resources

- [Morpho Blue Documentation](https://docs.morpho.org)
- [Morpho Blue App](https://app.morpho.org)
- [Chainlink Price Feeds](https://data.chain.link)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This software is provided "as is", without warranty of any kind. Users interact with DeFi protocols at their own risk. Always do your own research and understand the risks before using DeFi applications.