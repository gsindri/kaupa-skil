
import React, { useCallback, useRef } from 'react'
import { CacheContext } from './CacheManagerUtils'

export default function CacheProvider({ children }: { children: React.ReactNode }) {
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
