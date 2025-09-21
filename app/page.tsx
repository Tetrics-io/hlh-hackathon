import { WalletConnector } from '@/components/WalletConnector'
import { NetworkIndicator } from '@/components/NetworkIndicator'
import { MorphoLendingPanel } from '@/components/MorphoLendingPanel'
import { BridgePanel } from '@/components/BridgePanel'
import { TransactionGuards } from '@/components/TransactionGuards'
import { AutomationProvider } from '@/contexts/AutomationContext'

export default function Home() {
  return (
    <AutomationProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <NetworkIndicator />
        <TransactionGuards />
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Morpho Blue Lending Protocol
            </h1>
            <p className="text-gray-600 mt-1">
              Supply wstETH collateral and borrow WETH on Ethereum mainnet
            </p>
          </div>
        </header>

        {/* Wallet Connection */}
        <div className="container mx-auto px-4 py-4">
          <WalletConnector />
        </div>

        {/* Main Two-Column Layout */}
        <main className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Column 1: Borrow */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">1️⃣</span>
                    Borrow on Morpho
                  </h2>
                  <p className="text-sm opacity-90 mt-1">
                    Supply wstETH, borrow WETH
                  </p>
                </div>
                <div className="p-4">
                  <MorphoLendingPanel />
                </div>
              </div>
            </div>

            {/* Column 2: Bridge */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">2️⃣</span>
                    Bridge Assets
                  </h2>
                  <p className="text-sm opacity-90 mt-1">
                    Move funds to Hyperliquid
                  </p>
                </div>
                <div className="p-4">
                  <BridgePanel />
                </div>
              </div>
            </div>

          </div>

          {/* Flow Indicator (Desktop Only) */}
          <div className="hidden lg:flex justify-center items-center mt-8 px-12">
            <div className="flex-1 max-w-md h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded"></div>
            <div className="px-4">
              <div className="text-purple-600 text-2xl">→</div>
            </div>
          </div>

          {/* Helper Section */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">How It Works</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Step 1: Supply Collateral</h4>
                <p>Deposit wstETH as collateral on Morpho Blue. The protocol supports up to 86% loan-to-value ratio for optimal capital efficiency.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Step 2: Borrow & Bridge</h4>
                <p>Borrow WETH against your collateral and optionally bridge it to other chains using deBridge for cross-chain opportunities.</p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-200 bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium">Morpho Blue Lending Protocol on Ethereum Mainnet</p>
              <p className="mt-1">Powered by deBridge, Privy, and Viem</p>
            </div>
          </div>
        </footer>
      </div>
    </AutomationProvider>
  )
}