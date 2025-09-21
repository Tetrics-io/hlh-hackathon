import { WalletConnector } from '@/components/WalletConnector'
import { ChainInfo } from '@/components/ChainInfo'
import { CoreWriterInfo } from '@/components/CoreWriterInfo'
import { BridgePanel } from '@/components/BridgePanel'
import { TradingPanel } from '@/components/TradingPanel'
import { MorphoMarketInfo } from '@/components/MorphoMarketInfo'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Morpho → Hyperliquid Bridge & Trade
          </h1>
          <p className="text-gray-700 text-lg">
            Complete DeFi Flow: Borrow USDC on Morpho → Bridge to Hyperliquid → Trade on HyperEVM
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-6">
          <WalletConnector />
          <ChainInfo />
          
          {/* Flow Steps */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Complete Flow Steps:</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-md p-4">
                <div className="text-2xl mb-2">1️⃣</div>
                <h3 className="font-semibold">Borrow USDC</h3>
                <p className="text-sm opacity-90">Supply wstETH on Morpho, borrow USDC</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-md p-4">
                <div className="text-2xl mb-2">2️⃣</div>
                <h3 className="font-semibold">Bridge to HL</h3>
                <p className="text-sm opacity-90">Bridge USDC via deBridge to Hyperliquid</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-md p-4">
                <div className="text-2xl mb-2">3️⃣</div>
                <h3 className="font-semibold">Trade HYPE</h3>
                <p className="text-sm opacity-90">Trade HYPE-PERP with bridged USDC</p>
              </div>
            </div>
          </div>
          
          <CoreWriterInfo />
          
          {/* Morpho Market Info */}
          <MorphoMarketInfo />
          
          {/* Bridge Section */}
          <BridgePanel />
          
          {/* Trading Section */}
          <TradingPanel />
          
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl mb-2">🟦</div>
              <h3 className="font-semibold text-gray-900">Ethereum</h3>
              <p className="text-sm text-gray-600">Mainnet</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl mb-2">🔷</div>
              <h3 className="font-semibold text-gray-900">Arbitrum</h3>
              <p className="text-sm text-gray-600">Layer 2</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm text-center">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-gray-900">HyperEVM</h3>
              <p className="text-sm text-gray-600">High Performance</p>
            </div>
          </div>

          <footer className="text-center text-gray-600 text-sm mt-12 pb-4">
            <p className="font-medium">Built with Next.js, Wagmi, Viem, and Privy</p>
            <p className="mt-1">Supports WalletConnect, MetaMask, Rabby, and more</p>
          </footer>
        </div>
      </div>
    </div>
  )
}