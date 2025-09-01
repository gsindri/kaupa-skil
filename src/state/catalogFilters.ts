// src/state/catalogFilters.ts
import { useSyncExternalStore } from 'react'
import { createStore } from 'zustand/vanilla'
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

// 1) Framework-agnostic store (no React import here at all)
export const catalogFiltersStore = createStore<CatalogFiltersState>()((set, get) => ({
  filters: {},
  onlyWithPrice: false,
  sort: 'relevance',
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setOnlyWithPrice: (v) => set({ onlyWithPrice: v }),
  setSort: (s) => set({ sort: s }),
}))

// 2) React hook that subscribes via React’s own useSyncExternalStore
export function useCatalogFilters<T = CatalogFiltersState>(
  selector: (s: CatalogFiltersState) => T = (s) => s as unknown as T
): T {
  const getSnapshot = () => selector(catalogFiltersStore.getState())
  return useSyncExternalStore(catalogFiltersStore.subscribe, getSnapshot, getSnapshot)
}
