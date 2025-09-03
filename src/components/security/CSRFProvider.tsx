import React, { createContext, useContext, useEffect, useState } from 'react'
import { generateCSRFToken, getCSRFToken } from '@/lib/security'

interface CSRFContextType {
  token: string
  refreshToken: () => void
}

const CSRFContext = createContext<CSRFContextType | null>(null)

export function CSRFProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string>('')
  
  const refreshToken = () => {
    const newToken = generateCSRFToken()
    sessionStorage.setItem('csrf_token', newToken)
    setToken(newToken)
  }
  
  useEffect(() => {
    const currentToken = getCSRFToken()
    setToken(currentToken)
  }, [])
  
  return (
    <CSRFContext.Provider value={{ token, refreshToken }}>
      {children}
    </CSRFContext.Provider>
  )
}

export function useCSRF() {
  const context = useContext(CSRFContext)
  if (!context) {
    throw new Error('useCSRF must be used within a CSRFProvider')
  }
  return context
}