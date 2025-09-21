'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface AutomationState {
  autoBorrowEnabled: boolean
  autoTradeEnabled: boolean
  isProcessing: boolean
  lastAction: string | null
  lastActionTime: number | null
}

interface AutomationContextType extends AutomationState {
  toggleAutoBorrow: () => void
  toggleAutoTrade: () => void
  setProcessing: (processing: boolean) => void
  recordAction: (action: string) => void
  canExecuteAction: (action: string) => boolean
}

const AutomationContext = createContext<AutomationContextType | undefined>(undefined)

const DEBOUNCE_TIME = 5000 // 5 seconds between same actions

export function AutomationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AutomationState>({
    autoBorrowEnabled: false,
    autoTradeEnabled: false,
    isProcessing: false,
    lastAction: null,
    lastActionTime: null
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('automation_settings')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setState(prev => ({
            ...prev,
            autoBorrowEnabled: parsed.autoBorrowEnabled || false,
            autoTradeEnabled: parsed.autoTradeEnabled || false
          }))
        } catch (e) {
          console.error('Failed to load automation settings:', e)
        }
      }
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('automation_settings', JSON.stringify({
        autoBorrowEnabled: state.autoBorrowEnabled,
        autoTradeEnabled: state.autoTradeEnabled
      }))
    }
  }, [state.autoBorrowEnabled, state.autoTradeEnabled])

  const toggleAutoBorrow = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoBorrowEnabled: !prev.autoBorrowEnabled
    }))
  }, [])

  const toggleAutoTrade = useCallback(() => {
    setState(prev => ({
      ...prev,
      autoTradeEnabled: !prev.autoTradeEnabled
    }))
  }, [])

  const setProcessing = useCallback((processing: boolean) => {
    setState(prev => ({
      ...prev,
      isProcessing: processing
    }))
  }, [])

  const recordAction = useCallback((action: string) => {
    setState(prev => ({
      ...prev,
      lastAction: action,
      lastActionTime: Date.now()
    }))
  }, [])

  const canExecuteAction = useCallback((action: string) => {
    // Prevent double-fires with state machine
    if (state.isProcessing) return false
    
    // Check debounce for same action
    if (state.lastAction === action && state.lastActionTime) {
      const timeSinceLastAction = Date.now() - state.lastActionTime
      return timeSinceLastAction > DEBOUNCE_TIME
    }
    
    return true
  }, [state.isProcessing, state.lastAction, state.lastActionTime])

  const value: AutomationContextType = {
    ...state,
    toggleAutoBorrow,
    toggleAutoTrade,
    setProcessing,
    recordAction,
    canExecuteAction
  }

  return (
    <AutomationContext.Provider value={value}>
      {children}
    </AutomationContext.Provider>
  )
}

export function useAutomation() {
  const context = useContext(AutomationContext)
  if (context === undefined) {
    throw new Error('useAutomation must be used within an AutomationProvider')
  }
  return context
}