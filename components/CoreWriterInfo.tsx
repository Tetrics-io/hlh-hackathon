'use client'

import { HL_CORE_WRITER_ADDRESS } from '@/lib/config'
import { useState, useEffect } from 'react'

export function CoreWriterInfo() {
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(HL_CORE_WRITER_ADDRESS)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy address:', error)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-2 text-white">
            ⚡ HyperLiquid CoreWriter
          </h2>
          <p className="text-sm text-purple-100 mb-3">
            Official CoreWriter contract address for HyperEVM chain
          </p>
          
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white/90 backdrop-blur rounded-md text-sm font-mono border border-purple-200 text-gray-900 font-medium">
              {HL_CORE_WRITER_ADDRESS}
            </code>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-purple-700 hover:bg-purple-50'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-purple-100">
        <p>Use this address to interact with HyperLiquid&apos;s core smart contracts.</p>
        <p className="mt-1 font-semibold">Chain ID: 998 | Network: HyperEVM</p>
      </div>
    </div>
  )
}