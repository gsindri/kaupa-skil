
import React, { useEffect, useState } from 'react'
import { SettingsContext } from './SettingsProviderUtils'

const SETTINGS_CHANNEL_NAME = 'procurewise-settings'

type UserMode = 'just-order' | 'balanced' | 'analytical'

type SettingsMessage =
  | { type: 'VAT_CHANGED'; value: boolean }
  | { type: 'UNIT_CHANGED'; value: string }
  | { type: 'USER_MODE_CHANGED'; value: UserMode }

const broadcastSettingsMessage = (message: SettingsMessage) => {
  if (typeof BroadcastChannel === 'undefined') {
    return
  }

  const channel = new BroadcastChannel(SETTINGS_CHANNEL_NAME)
  channel.postMessage(message)
  channel.close()
}

export default function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [includeVat, setIncludeVat] = useState(() => {
    const saved = localStorage.getItem('procurewise-include-vat')
    return saved ? JSON.parse(saved) : false
  })

  const [preferredUnit, setPreferredUnit] = useState(() => {
    const saved = localStorage.getItem('procurewise-preferred-unit')
    return saved || 'auto'
  })

  const [userMode, setUserMode] = useState<UserMode>(() => {
    const saved = localStorage.getItem('procurewise-user-mode')
    return (saved as UserMode) || 'balanced'
  })

  // Sync settings across tabs
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return
    }

    const channel = new BroadcastChannel(SETTINGS_CHANNEL_NAME)

    const handleMessage = (event: MessageEvent<SettingsMessage>) => {
      if (event.data.type === 'VAT_CHANGED') {
        setIncludeVat(event.data.value)
      } else if (event.data.type === 'UNIT_CHANGED') {
        setPreferredUnit(event.data.value)
      } else if (event.data.type === 'USER_MODE_CHANGED') {
        setUserMode(event.data.value)
      }
    }

    channel.addEventListener('message', handleMessage)
    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [])

  const handleSetIncludeVat = (value: boolean) => {
    setIncludeVat(value)
    localStorage.setItem('procurewise-include-vat', JSON.stringify(value))

    broadcastSettingsMessage({ type: 'VAT_CHANGED', value })
  }

  const handleSetPreferredUnit = (value: string) => {
    setPreferredUnit(value)
    localStorage.setItem('procurewise-preferred-unit', value)

    broadcastSettingsMessage({ type: 'UNIT_CHANGED', value })
  }

  const handleSetUserMode = (value: UserMode) => {
    setUserMode(value)
    localStorage.setItem('procurewise-user-mode', value)

    broadcastSettingsMessage({ type: 'USER_MODE_CHANGED', value })
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
