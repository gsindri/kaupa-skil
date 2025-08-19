import { createContext, useContext } from 'react'

export interface CacheContextType {
  getFromCache: (key: string) => any
  setInCache: (key: string, value: any, ttl?: number) => void
  clearCache: () => void
}

export const CacheContext = createContext<CacheContextType | null>(null)

export function useCache() {
  const context = useContext(CacheContext)
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider')
  }
  return context
}
