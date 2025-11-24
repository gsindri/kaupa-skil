import { createContext } from 'react'

export interface SettingsContextType {
  includeVat: boolean
  setIncludeVat: (value: boolean) => void
  preferredUnit: string
  setPreferredUnit: (value: string) => void
  userMode: 'just-order' | 'balanced' | 'analytical'
  setUserMode: (value: 'just-order' | 'balanced' | 'analytical') => void
  emailIntegration: 'none' | 'gmail' | 'outlook'
  setEmailIntegration: (value: 'none' | 'gmail' | 'outlook') => void
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined)
