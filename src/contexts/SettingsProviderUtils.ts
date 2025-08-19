import { createContext, useContext } from 'react'

export interface SettingsContextType {
  includeVat: boolean
  setIncludeVat: (value: boolean) => void
  preferredUnit: string
  setPreferredUnit: (value: string) => void
  userMode: 'just-order' | 'balanced' | 'analytical'
  setUserMode: (value: 'just-order' | 'balanced' | 'analytical') => void
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
