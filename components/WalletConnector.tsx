'use client'

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { supportedChains } from '@/lib/config'
import { useEffect, useState } from 'react'

export function WalletConnector() {
  const { ready, authenticated, user, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, chains, isPending: isSwitchingChain } = useSwitchChain()
  const [connectedAddress, setConnectedAddress] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Get address from Privy wallet or wagmi
    if (wallets && wallets.length > 0) {
      const activeWallet = wallets[0]
      if (activeWallet?.address) {
        setConnectedAddress(activeWallet.address)
      }
    } else if (address) {
      setConnectedAddress(address)
    } else if (user?.wallet?.address) {
      setConnectedAddress(user.wallet.address)
    }
  }, [wallets, address, user])

  const formatAddress = (addr: string) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await logout()
      setConnectedAddress('')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  if (!mounted || !ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse text-gray-600">Loading wallet...</div>
      </div>
    )
  }

  const currentChain = chains?.find(c => c.id === chainId)
  const displayAddress = connectedAddress || address || user?.wallet?.address || ''

  return (
    <div className="flex flex-col gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Wallet Connection</h2>
        {authenticated ? (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {authenticated && (
        <>
          <div className="space-y-2">
            {displayAddress && (
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Address:</span>
                <code className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-900">
                  {formatAddress(displayAddress)}
                </code>
              </div>
            )}
            
            {(user?.linkedAccounts?.length || 0) > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Auth Method:</span>
                <span className="text-sm font-medium capitalize text-gray-900">
                  {user?.linkedAccounts?.[0]?.type || 'wallet'}
                </span>
              </div>
            )}

            {wallets && wallets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Wallet Type:</span>
                <span className="text-sm font-medium text-gray-900">
                  {wallets[0]?.walletClientType || 'Connected Wallet'}
                </span>
              </div>
            )}
          </div>

          {isConnected && chains && chains.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Current Chain:</span>
                <span className="font-semibold text-gray-900">
                  {currentChain?.name || 'Unknown'} (ID: {chainId})
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="text-gray-700 font-medium">Switch to:</span>
                {supportedChains.map((supportedChain) => (
                  <button
                    key={supportedChain.id}
                    onClick={() => switchChain({ chainId: supportedChain.id })}
                    disabled={chainId === supportedChain.id || isSwitchingChain}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      chainId === supportedChain.id
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {supportedChain.icon} {supportedChain.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!displayAddress && (
            <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2">
              Wallet connected. Waiting for address...
            </div>
          )}
        </>
      )}
    </div>
  )
}