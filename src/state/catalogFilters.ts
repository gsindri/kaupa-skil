// src/state/catalogFilters.ts
import React from 'react'
import { createStore } from 'zustand/vanilla'
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/shim/with-selector'
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

// ------------- Store (framework-agnostic) -------------
export const catalogFiltersStore = createStore<CatalogFiltersState>()((set, get) => ({
  filters: {},
  onlyWithPrice: false,
  sort: 'relevance',
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setOnlyWithPrice: (v) => set({ onlyWithPrice: v }),
  setSort: (s) => set({ sort: s }),
}))

// ------------- Utilities -------------
function shallowEqual<T extends Record<string, any>>(a: T, b: T) {
  if (Object.is(a, b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false
  const ka = Object.keys(a)
  const kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  for (let i = 0; i < ka.length; i++) {
    const k = ka[i]!
    if (!Object.prototype.hasOwnProperty.call(b, k) || !Object.is(a[k], (b as any)[k])) {
      return false
    }
  }
  return true
}

// ------------- Hook (stable snapshots) -------------
export function useCatalogFilters<T = CatalogFiltersState>(
  selector: (s: CatalogFiltersState) => T = (s) => s as unknown as T,
  equals?: (a: T, b: T) => boolean,
): T {
  return useSyncExternalStoreWithSelector(
    // subscribe
    (cb) => catalogFiltersStore.subscribe(cb),
    // getSnapshot (current state)
    () => catalogFiltersStore.getState(),
    // getServerSnapshot (use same as client snapshot)
    () => catalogFiltersStore.getState(),
    // selector and equality comparator
    selector,
    equals ?? Object.is,
  )
}

// Convenience helpers for common patterns
export const selectors = {
  // select primitives only (super stable)
  onlyWithPrice: (s: CatalogFiltersState) => s.onlyWithPrice,
  sort: (s: CatalogFiltersState) => s.sort,
  filters: (s: CatalogFiltersState) => s.filters,
  // actions as primitives (function refs are stable)
  setOnlyWithPrice: (s: CatalogFiltersState) => s.setOnlyWithPrice,
  setSort: (s: CatalogFiltersState) => s.setSort,
  setFilters: (s: CatalogFiltersState) => s.setFilters,
}

// optional: shallow comparator export for callers that return objects/tuples
export const shallow = shallowEqual
