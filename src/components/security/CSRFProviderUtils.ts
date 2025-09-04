import { createContext, useContext } from 'react'

export interface CSRFContextType {
  token: string
  refreshToken: () => void
}

export const CSRFContext = createContext<CSRFContextType | null>(null)

export function useCSRF() {
  const context = useContext(CSRFContext)
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider')
  }
  return context
}

