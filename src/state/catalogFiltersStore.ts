import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/vanilla/shallow'
import type { FacetFilters } from '@/services/catalog'

// Zustand store managing catalog filter state. Utility helpers have been
// separated into "@/utils/catalogFilters" to keep this module focused on state.

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

export type TriState = 'off' | 'include' | 'exclude'
export type TriStock = TriState

interface CatalogFiltersState {
  /** Current facet filters applied to the catalog */
  filters: FacetFilters
  /** Whether to show only items with price information */
  onlyWithPrice: boolean
  /** Tri-state stock filter */
  triStock: TriState
  /** Tri-state special filter */
  triSpecial: TriState
  /** Tri-state my suppliers filter */
  triSuppliers: TriState
  /** Selected sort order */
  sort: SortOrder
  setFilters: (f: Partial<FacetFilters>) => void
  setOnlyWithPrice: (v: boolean) => void
  setTriStock: (v: TriState) => void
  setTriSpecial: (v: TriState) => void
  setTriSuppliers: (v: TriState) => void
  setSort: (v: SortOrder) => void
  clear: () => void
}

const defaultState: Omit<
  CatalogFiltersState,
  | 'setFilters'
  | 'setOnlyWithPrice'
  | 'setSort'
  | 'setTriStock'
  | 'setTriSpecial'
  | 'setTriSuppliers'
  | 'clear'
> = {
  filters: {},
  onlyWithPrice: false,
  triStock: 'off',
  triSpecial: 'off',
  triSuppliers: 'off',
  sort: 'relevance',
}

export const useCatalogFilters = create<CatalogFiltersState>()(
  persist(
    set => ({
      ...defaultState,
      setFilters: f =>
        set(state => {
          // Only update if filters actually changed to prevent unnecessary re-renders
          const newFilters = { ...state.filters, ...f }
          const hasChanges = Object.keys(f).some(key =>
            JSON.stringify(state.filters[key as keyof FacetFilters]) !==
              JSON.stringify(newFilters[key as keyof FacetFilters])
          )
          return hasChanges ? { filters: newFilters } : state
        }),
      setOnlyWithPrice: v => set({ onlyWithPrice: v }),
      setSort: v => set({ sort: v }),
      setTriStock: v =>
        set(state => (state.triStock === v ? state : { triStock: v })),
      setTriSpecial: v =>
        set(state => (state.triSpecial === v ? state : { triSpecial: v })),
      setTriSuppliers: v =>
        set(state => (state.triSuppliers === v ? state : { triSuppliers: v })),
      clear: () => set({ ...defaultState }),
    }),
    { name: 'catalogFilters' },
  ),
)

export { shallow }

