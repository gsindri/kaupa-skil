import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'
import type { FacetFilters } from '@/services/catalog'

export type SortOrder = 'relevance' | string

export interface CatalogFiltersState {
  filters: FacetFilters
  onlyWithPrice: boolean
  sort: SortOrder
  setFilters: (patch: Partial<FacetFilters>) => void
  setOnlyWithPrice: (v: boolean) => void
  setSort: (s: SortOrder) => void
}

export const catalogFiltersStore = createStore<CatalogFiltersState>()(
  set => ({
    filters: {},
    onlyWithPrice: false,
    sort: 'relevance',
    setFilters: patch =>
      set(state => ({ filters: { ...state.filters, ...patch } })),
    setOnlyWithPrice: v => set({ onlyWithPrice: v }),
    setSort: s => set({ sort: s }),
  })
)

export function useCatalogFilters<T>(
  selector: (s: CatalogFiltersState) => T,
  equals?: (a: T, b: T) => boolean
) {
  return useStore(catalogFiltersStore, selector, equals)
}

