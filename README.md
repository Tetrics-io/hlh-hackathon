# Tetrics Protocol - Cross-Chain DeFi on Hyperliquid

## What We Built

Tetrics Protocol is a cross-chain DeFi platform that bridges the gap between
Ethereum's lending markets and Hyperliquid's trading ecosystem. We've created a
seamless user experience where users can leverage their assets on Morpho Blue
(Ethereum) and instantly bridge the borrowed funds to Hyperliquid for trading
opportunities.

## How It Works - Technical Integration

### The User Journey

1. **Connect & Supply**: Users connect their wallet and supply wstETH as
   collateral on Morpho Blue (Ethereum mainnet)
2. **Borrow USDC**: Using up to 86% LTV, users borrow USDC against their
   collateral
3. **Bridge to Hyperliquid**: The borrowed USDC is bridged through deBridge
   directly to Hyperliquid
4. **Trade & Earn**: Users can now trade on Hyperliquid with their borrowed
   capital

### Technical Architecture

```
User Wallet → Morpho Blue (ETH) → deBridge Widget → Hyperliquid (998)
     ↑              ↓                    ↓                ↓
   wstETH      Borrow USDC         Bridge USDC      Trade/Earn
```

### Core Components

#### 1. **Morpho Blue Integration** (`/hooks/useMorphoData.ts`, `/lib/morpho/`)

- Direct integration with Morpho Blue protocol using their SDK
- Real-time position tracking (health factor, available to borrow)
- Bundled transactions for supply + borrow in one click
- Automatic calculation of safe borrowing limits

#### 2. **deBridge Widget Integration** (`/components/BridgePanel.tsx`, `/lib/debridge/`)

- Embedded widget for in-app bridging experience
- Custom theme matching Hyperliquid's dark UI
- Real-time transaction status tracking
- Event listeners for bridge lifecycle management

#### 3. **Cross-Chain State Management** (`/contexts/AutomationContext.tsx`)

- Unified state across Ethereum and Hyperliquid operations
- Transaction guards to prevent dangerous operations
- Automatic network switching when needed

## deBridge Track - Specific Features We Built

### 1. **Embedded Widget with Custom Theme**

```typescript
// /lib/debridge/config.ts
export const widgetConfig = {
   appId: 12203,
   theme: "dark",
   colors: {
      primary: "#2EBD85", // Hyperliquid green
      background: "#0B0E11", // Dark background
      text: "#E8EAED", // Light text
   },
   chains: {
      inputChains: { include: [1, 42161] }, // ETH, Arbitrum
      outputChains: { include: [998] }, // Hyperliquid only
   },
};
```

### 2. **Real-Time Bridge Status Tracking**

```typescript
// /components/BridgePanel.tsx
widget.on("order", (orderData) => {
   setCurrentOrder(orderData);
   setBridgeStatus("pending");
   // Show live transaction progress
});

widget.on("bridge", (bridgeData) => {
   if (bridgeData.status === "completed") {
      setBridgeStatus("success");
      // Trigger success flow
   }
});
```

### 3. **Seamless UX Flow Integration**

- Pre-configured routes: Ethereum → Hyperliquid
- Auto-populated amounts from Morpho borrowing
- Visual status indicators matching our dark theme
- Error handling with retry mechanisms

### 4. **Smart Route Optimization**

- Automatically selects fastest route (direct or via Arbitrum)
- Gas estimation displayed before bridging
- Support for multiple tokens (USDC, USDT, ETH)

## Key Files Demonstrating deBridge Integration

### Widget Implementation

- [`/components/BridgePanel.tsx`](./components/BridgePanel.tsx) - Main bridge
  component with deBridge widget
- [`/lib/debridge/config.ts`](./lib/debridge/config.ts) - Widget configuration
  and theming
- [`/app/layout.tsx`](./app/layout.tsx) - deBridge script loading

### Event Handling & Status

- [`/components/BridgePanel.tsx#L104-159`](./components/BridgePanel.tsx#L104) -
  Event listeners for bridge lifecycle
- [`/hooks/useBridgeStatus.ts`](./hooks/useBridgeStatus.ts) - Custom hook for
  bridge state management

### UI/UX Integration

- [`/app/page.tsx#L119-143`](./app/page.tsx#L119) - Bridge panel integration in
  main UI
- [`/app/globals.css`](./app/globals.css) - Dark theme styling matching
  Hyperliquid

## Technical Highlights

### Why deBridge?

- **Speed**: Sub-30 second bridging to Hyperliquid
- **Reliability**: Battle-tested infrastructure
- **UX**: Embedded widget provides seamless experience
- **Flexibility**: Supports multiple chains and tokens

### Innovation Points

1. **One-Click DeFi**: Supply, borrow, and bridge in a streamlined flow
2. **Risk Management**: Built-in health factor monitoring prevents liquidations
3. **Cross-Chain Continuity**: Unified experience across Ethereum and
   Hyperliquid

## Running the Project

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-repo/tetrics-hackathon
cd tetrics-hackathon/web3-app

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Add your Privy App ID and RPC endpoints

# Run development server
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_id
NEXT_PUBLIC_ETHEREUM_RPC=your_eth_rpc
NEXT_PUBLIC_USE_TESTNET=false
```

## Live Demo Flow

1. **Connect Wallet** - Use any Ethereum wallet
2. **Supply wstETH** - Enter amount to use as collateral
3. **Auto-Calculate Borrow** - System calculates safe USDC borrow amount
4. **Execute Bundle** - Single transaction for supply + borrow
5. **Bridge to Hyperliquid** - Use embedded deBridge widget
6. **Track Status** - Real-time updates on bridge progress

## Architecture Decisions

### Why Morpho Blue?

- Highest capital efficiency (86% LTV)
- Battle-tested protocol with strong security
- wstETH/USDC is a highly liquid market

### Why Embedded Widget vs API?

- Better UX - users stay in our app
- Easier integration - no backend required
- Real-time events - instant status updates

### Why Hyperliquid?

- Growing ecosystem with high trading volume
- Need for borrowed liquidity from Ethereum
- Limited native lending options

## Future Enhancements

- [ ] Auto-bridge when borrow completes
- [ ] Return path: Hyperliquid → Ethereum for repayment
- [ ] Multiple collateral types
- [ ] Position management dashboard
- [ ] Mobile app with WalletConnect

## Team

Built for the Hyperliquid Hackathon by Team Tetrics

---

_This project showcases the power of deBridge in creating seamless cross-chain
DeFi experiences. By embedding the deBridge widget directly into our application
flow, we've eliminated the friction typically associated with bridge operations,
making cross-chain lending and trading as simple as a few clicks._
