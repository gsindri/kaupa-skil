
import React, { useEffect, useState } from 'react'
import { SettingsContext } from './SettingsProviderUtils'

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [includeVat, setIncludeVat] = useState(() => {
    const saved = localStorage.getItem('procurewise-include-vat')
    return saved ? JSON.parse(saved) : false
  })
  
  const [preferredUnit, setPreferredUnit] = useState(() => {
    const saved = localStorage.getItem('procurewise-preferred-unit')
    return saved || 'auto'
  })

  const [userMode, setUserMode] = useState<'just-order' | 'balanced' | 'analytical'>(() => {
    const saved = localStorage.getItem('procurewise-user-mode')
    return saved as 'just-order' | 'balanced' | 'analytical' || 'balanced'
  })

  // Sync settings across tabs
  useEffect(() => {
    const channel = new BroadcastChannel('procurewise-settings')
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'VAT_CHANGED') {
        setIncludeVat(event.data.value)
      } else if (event.data.type === 'UNIT_CHANGED') {
        setPreferredUnit(event.data.value)
      } else if (event.data.type === 'USER_MODE_CHANGED') {
        setUserMode(event.data.value)
      }
    }

    channel.addEventListener('message', handleMessage)
    return () => channel.close()
  }, [])

  const handleSetIncludeVat = (value: boolean) => {
    setIncludeVat(value)
    localStorage.setItem('procurewise-include-vat', JSON.stringify(value))
    
    const channel = new BroadcastChannel('procurewise-settings')
    channel.postMessage({ type: 'VAT_CHANGED', value })
    channel.close()
  }

  const handleSetPreferredUnit = (value: string) => {
    setPreferredUnit(value)
    localStorage.setItem('procurewise-preferred-unit', value)
    
    const channel = new BroadcastChannel('procurewise-settings')
    channel.postMessage({ type: 'UNIT_CHANGED', value })
    channel.close()
  }

  const handleSetUserMode = (value: 'just-order' | 'balanced' | 'analytical') => {
    setUserMode(value)
    localStorage.setItem('procurewise-user-mode', value)
    
    const channel = new BroadcastChannel('procurewise-settings')
    channel.postMessage({ type: 'USER_MODE_CHANGED', value })
    channel.close()
  }

  return (
    <SettingsContext.Provider value={{
      includeVat,
      setIncludeVat: handleSetIncludeVat,
      preferredUnit,
      setPreferredUnit: handleSetPreferredUnit,
      userMode,
      setUserMode: handleSetUserMode
    }}>
      {children}
    </SettingsContext.Provider>
  )
}
