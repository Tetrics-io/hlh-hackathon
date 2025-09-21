'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAccount, useChainId } from 'wagmi'
import { getWidgetConfig, type BridgeStatus, type DeBridgeOrder } from '@/lib/debridge/config'

declare global {
  interface Window {
    deBridge: any
  }
}

export function BridgePanel() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const widgetRef = useRef<any>(null)
  const initializingRef = useRef(false)
  
  const [mounted, setMounted] = useState(false)
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>('idle')
  const [currentOrder, setCurrentOrder] = useState<DeBridgeOrder | null>(null)
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false)
  
  // Determine if we're on testnet based on chain ID
  const isTestnet = chainId === 5 || chainId === 421613 // Goerli or Arbitrum Goerli
  
  // Ensure component is mounted before rendering widget
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (!mounted) return
    
    let timeoutId: NodeJS.Timeout
    
    // Initialize widget when component mounts
    const initWidget = async () => {
      // Check if already initialized or currently initializing
      if (widgetRef.current || initializingRef.current) return
      
      // Check if widget element already exists (from previous initialization)
      const existingWidget = document.querySelector('#debridgeWidget iframe')
      if (existingWidget) {
        setIsWidgetLoaded(true)
        return
      }
      
      // Wait for deBridge script to load
      if (typeof window === 'undefined' || !window.deBridge) {
        timeoutId = setTimeout(initWidget, 500)
        return
      }
      
      initializingRef.current = true
      
      try {
        const config = {
          ...getWidgetConfig(isTestnet),
          element: 'debridgeWidget', // Use string ID instead of element reference
          // Add wallet address if connected
          ...(address && { address }),
        }
        
        // Initialize the widget
        const widget = await window.deBridge.widget(config)
        widgetRef.current = widget
        
        // Set up event listeners
        setupEventListeners(widget)
        
        setIsWidgetLoaded(true)
      } catch (error) {
        console.error('Failed to initialize deBridge widget:', error)
        toast.error('Failed to load bridge widget')
      } finally {
        initializingRef.current = false
      }
    }
    
    initWidget()
    
    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      
      if (widgetRef.current) {
        // Remove event listeners
        if (widgetRef.current.off) {
          widgetRef.current.off('needConnect')
          widgetRef.current.off('order')
          widgetRef.current.off('bridge')
          widgetRef.current.off('error')
          widgetRef.current.off('inputChainChanged')
          widgetRef.current.off('outputChainChanged')
        }
        widgetRef.current = null
      }
      initializingRef.current = false
    }
  }, [mounted]) // Remove address and isTestnet from dependencies to prevent re-initialization
  
  const setupEventListeners = (widget: any) => {
    // Listen for wallet connection requirement
    widget.on('needConnect', () => {
      toast('Please connect your wallet to continue', {
        icon: '🔗',
      })
    })
    
    // Listen for order creation
    widget.on('order', (orderData: any) => {
      setCurrentOrder(orderData)
      setBridgeStatus('pending')
      
      toast.loading('Bridge transaction initiated...', {
        id: 'bridge-order',
      })
      
      if (orderData.txHash) {
        toast.success(
          <div>
            <p>Transaction submitted!</p>
            <p className="text-xs mt-1">
              Hash: {orderData.txHash.slice(0, 10)}...{orderData.txHash.slice(-8)}
            </p>
          </div>,
          { id: 'bridge-order' }
        )
      }
    })
    
    // Listen for bridge completion
    widget.on('bridge', (bridgeData: any) => {
      if (bridgeData.status === 'success' || bridgeData.status === 'completed') {
        setBridgeStatus('success')
        toast.success('Bridge completed successfully! Your USDC is on Hyperliquid.', {
          duration: 5000,
        })
      }
    })
    
    // Listen for errors
    widget.on('error', (error: any) => {
      console.error('Bridge error:', error)
      setBridgeStatus('error')
      toast.error(`Bridge failed: ${error.message || 'Unknown error'}`)
    })
    
    // Listen for chain changes (silent tracking)
    widget.on('inputChainChanged', (chainId: number) => {
      // Silently track chain changes
    })
    
    widget.on('outputChainChanged', (chainId: number) => {
      // Silently track chain changes
    })
  }
  
  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bridge USDC to Hyperliquid
        </h3>
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading bridge...</p>
        </div>
      </div>
    )
  }
  
  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bridge USDC to Hyperliquid
        </h3>
        <p className="text-gray-600 text-center">Please connect your wallet to bridge</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Bridge USDC to Hyperliquid
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Bridge your USDC from Ethereum to Hyperliquid via Arbitrum
        </p>
        
        {/* Status indicator */}
        {bridgeStatus !== 'idle' && (
          <div className={`mt-3 px-3 py-2 rounded-md text-sm ${
            bridgeStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            bridgeStatus === 'success' ? 'bg-green-100 text-green-800' :
            bridgeStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            Status: {bridgeStatus === 'pending' ? 'Bridge in progress...' :
                    bridgeStatus === 'success' ? 'Bridge completed!' :
                    bridgeStatus === 'error' ? 'Bridge failed' : 'Ready'}
          </div>
        )}
        
        {/* Current order details */}
        {currentOrder && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs">
            <p><strong>Order ID:</strong> {currentOrder.orderId}</p>
            <p><strong>Amount:</strong> {currentOrder.fromAmount} USDC</p>
            {currentOrder.txHash && (
              <p><strong>Tx Hash:</strong> {currentOrder.txHash.slice(0, 20)}...</p>
            )}
          </div>
        )}
      </div>
      
      {/* Widget container */}
      <div className="p-6">
        {!isWidgetLoaded && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading bridge widget...</p>
          </div>
        )}
        
        {/* deBridge widget will be injected here */}
        <div 
          id="debridgeWidget"
          className={`${isWidgetLoaded ? '' : 'hidden'}`}
          style={{ minHeight: '600px' }}
        />
      </div>
      
      {/* Info section */}
      <div className="px-6 pb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-900">Bridge Flow:</h4>
          <ul className="text-xs text-blue-800 mt-2 space-y-1">
            <li>1. Connect your wallet with USDC on Ethereum</li>
            <li>2. Enter the amount you want to bridge</li>
            <li>3. Confirm the transaction in your wallet</li>
            <li>4. Wait for bridge completion (typically 5-10 minutes)</li>
            <li>5. Your USDC will appear on Hyperliquid for trading!</li>
          </ul>
          {isTestnet && (
            <p className="text-xs text-blue-700 mt-2 font-medium">
              ⚠️ Using testnet configuration (Goerli → Arbitrum Goerli)
            </p>
          )}
        </div>
      </div>
    </div>
  )
}