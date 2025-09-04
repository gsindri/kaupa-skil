import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/vanilla/shallow'
import type { FacetFilters } from '@/services/catalog'

// Legacy types kept for backward compatibility with code that may import them
export type AvailabilityFilter = 'in' | 'low' | 'out' | 'unknown'
export type SortKey = 'name' | 'price' | 'availability'
export type SortDir = 'asc' | 'desc'
export interface Sort {
  key: SortKey
  dir: SortDir
}

// Catalog sorting options used across the app
export type SortOrder =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'az'
  | 'recent'

interface CatalogFiltersState {
  /** Current facet filters applied to the catalog */
  filters: FacetFilters
  /** Whether to show only items with price information */
  onlyWithPrice: boolean
  /** Selected sort order */
  sort: SortOrder
  setFilters: (f: Partial<FacetFilters>) => void
  setOnlyWithPrice: (v: boolean) => void
  setSort: (v: SortOrder) => void
  clear: () => void
}

const defaultState: Omit<
  CatalogFiltersState,
  'setFilters' | 'setOnlyWithPrice' | 'setSort' | 'clear'
> = {
  filters: {},
  onlyWithPrice: false,
  sort: 'relevance',
}

export const useCatalogFilters = create<CatalogFiltersState>()(
  persist(
    set => ({
      ...defaultState,
      setFilters: f =>
        set(state => ({ filters: { ...state.filters, ...f } })),
      setOnlyWithPrice: v => set({ onlyWithPrice: v }),
      setSort: v => set({ sort: v }),
      clear: () => set({ ...defaultState }),
    }),
    { name: 'catalogFilters' },
  ),
)

export { shallow }

