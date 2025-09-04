import React, { useEffect, useState } from 'react'
import { generateCSRFToken, getCSRFToken } from '@/lib/security'
import { CSRFContext } from './CSRFProviderUtils'

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