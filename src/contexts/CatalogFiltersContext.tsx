import { createContext, useContext } from 'react'
import type { FacetFilters } from '@/services/catalog'

interface CatalogFiltersContextValue {
  filters: FacetFilters
  setFilters: React.Dispatch<React.SetStateAction<FacetFilters>>
}

const CatalogFiltersContext = createContext<CatalogFiltersContextValue | undefined>(undefined)

export function CatalogFiltersProvider({
  value,
  children,
}: {
  value: CatalogFiltersContextValue
  children: React.ReactNode
}) {
  return (
    <CatalogFiltersContext.Provider value={value}>
      {children}
    </CatalogFiltersContext.Provider>
  )
}

export function useCatalogFilters() {
  const context = useContext(CatalogFiltersContext)
  if (!context) throw new Error('useCatalogFilters must be used within CatalogFiltersProvider')
  return context
}

