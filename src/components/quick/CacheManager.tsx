
import React, { createContext, useContext, useCallback, useRef } from 'react'

interface CacheContextType {
  getFromCache: (key: string) => any
  setInCache: (key: string, value: any, ttl?: number) => void
  clearCache: () => void
}

const CacheContext = createContext<CacheContextType | null>(null)

export function CacheProvider({ children }: { children: React.ReactNode }) {
  const cache = useRef(new Map<string, { value: any; expires: number }>())

  const getFromCache = useCallback((key: string) => {
    const item = cache.current.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      cache.current.delete(key)
      return null
    }
    
    return item.value
  }, [])

  const setInCache = useCallback((key: string, value: any, ttl = 5 * 60 * 1000) => {
    cache.current.set(key, {
      value,
      expires: Date.now() + ttl
    })
  }, [])

  const clearCache = useCallback(() => {
    cache.current.clear()
  }, [])

  return (
    <CacheContext.Provider value={{ getFromCache, setInCache, clearCache }}>
      {children}
    </CacheContext.Provider>
  )
}

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}
