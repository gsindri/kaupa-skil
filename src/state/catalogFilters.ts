import { create } from 'zustand/react'
import type { FacetFilters } from '@/services/catalog'

export type SortOrder = 'relevance' | string

interface CatalogFiltersState {
  filters: FacetFilters
  onlyWithPrice: boolean
  sort: SortOrder
  setFilters: (filters: Partial<FacetFilters>) => void
  setOnlyWithPrice: (value: boolean) => void
  setSort: (sort: SortOrder) => void
}

export const useCatalogFilters = create<CatalogFiltersState>(set => ({
  filters: {},
  onlyWithPrice: false,
  sort: 'relevance',
  setFilters: filters =>
    set(state => ({ filters: { ...state.filters, ...filters } })),
  setOnlyWithPrice: value => set({ onlyWithPrice: value }),
  setSort: sort => set({ sort }),
}))

