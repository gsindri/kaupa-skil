import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/vanilla/shallow'

export type AvailabilityFilter = 'in' | 'low' | 'out' | 'unknown'
export type SortKey = 'name' | 'price' | 'availability'
export type SortDir = 'asc' | 'desc'

export interface Sort {
  key: SortKey
  dir: SortDir
}

// Backward compatible alias
export type SortOrder = Sort

export interface CatalogFiltersState {
  search: string
  availability: AvailabilityFilter[]
  suppliers: string[]
  specials: boolean
  mySuppliersOnly: boolean
  priceMin?: number
  priceMax?: number
  sort: Sort
  setSearch: (v: string) => void
  toggleAvailability: (v: AvailabilityFilter) => void
  setSuppliers: (ids: string[]) => void
  setSpecials: (v: boolean) => void
  setMySuppliersOnly: (v: boolean) => void
  setPriceRange: (min?: number, max?: number) => void
  setSort: (s: Sort) => void
  clear: () => void
}

const defaultState: Omit<CatalogFiltersState,
  | 'setSearch'
  | 'toggleAvailability'
  | 'setSuppliers'
  | 'setSpecials'
  | 'setMySuppliersOnly'
  | 'setPriceRange'
  | 'setSort'
  | 'clear'
> = {
  search: '',
  availability: [],
  suppliers: [],
  specials: false,
  mySuppliersOnly: false,
  priceMin: undefined,
  priceMax: undefined,
  sort: { key: 'name', dir: 'asc' },
}

export const useCatalogFilters = create<CatalogFiltersState>()(
  persist(
    (set, get) => ({
      ...defaultState,
      setSearch: (v) => set({ search: v }),
      toggleAvailability: (v) =>
        set((s) => ({
          availability: s.availability.includes(v)
            ? s.availability.filter((a) => a !== v)
            : [...s.availability, v],
        })),
      setSuppliers: (ids) => set({ suppliers: ids }),
      setSpecials: (v) => set({ specials: v }),
      setMySuppliersOnly: (v) => set({ mySuppliersOnly: v }),
      setPriceRange: (min, max) => set({ priceMin: min, priceMax: max }),
      setSort: (sort) => set({ sort }),
      clear: () => set({ ...defaultState }),
    }),
    { name: 'catalogFilters' },
  ),
)

export const selectors = {
  search: (s: CatalogFiltersState) => s.search,
  availability: (s: CatalogFiltersState) => s.availability,
  suppliers: (s: CatalogFiltersState) => s.suppliers,
  specials: (s: CatalogFiltersState) => s.specials,
  mySuppliersOnly: (s: CatalogFiltersState) => s.mySuppliersOnly,
  priceMin: (s: CatalogFiltersState) => s.priceMin,
  priceMax: (s: CatalogFiltersState) => s.priceMax,
  sort: (s: CatalogFiltersState) => s.sort,
  setSearch: (s: CatalogFiltersState) => s.setSearch,
  toggleAvailability: (s: CatalogFiltersState) => s.toggleAvailability,
  setSuppliers: (s: CatalogFiltersState) => s.setSuppliers,
  setSpecials: (s: CatalogFiltersState) => s.setSpecials,
  setMySuppliersOnly: (s: CatalogFiltersState) => s.setMySuppliersOnly,
  setPriceRange: (s: CatalogFiltersState) => s.setPriceRange,
  setSort: (s: CatalogFiltersState) => s.setSort,
  clear: (s: CatalogFiltersState) => s.clear,
}

export { shallow }

