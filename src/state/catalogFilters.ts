// src/state/catalogFilters.ts
import { useState, useCallback, useEffect } from 'react'
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

// ------------- Hook -------------
export function useCatalogFilters<T = CatalogFiltersState>(
  selector: (s: CatalogFiltersState) => T = (s) => s as unknown as T,
  equals?: (a: T, b: T) => boolean,
): T {
  const STORAGE_KEY = 'catalogFilters'

  const [filters, setFiltersState] = useState<FacetFilters>({})
  const [onlyWithPrice, setOnlyWithPriceState] = useState(false)
  const [sort, setSortState] = useState<SortOrder>('relevance')

  // Load saved filters on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setFiltersState(parsed.filters ?? {})
        setOnlyWithPriceState(parsed.onlyWithPrice ?? false)
        setSortState(parsed.sort ?? 'relevance')
      }
    } catch {
      // ignore invalid data
    }
  }, [])

  const setFilters = useCallback((patch: Partial<FacetFilters>) => {
    setFiltersState(prev => {
      const next = { ...prev, ...patch }
      for (const key of Object.keys(next) as (keyof FacetFilters)[]) {
        if (next[key] === undefined) delete next[key]
      }
      return next
    })
  }, [])

  const setOnlyWithPrice = useCallback((v: boolean) => {
    setOnlyWithPriceState(v)
  }, [])

  const setSort = useCallback((s: SortOrder) => {
    setSortState(s)
  }, [])

  // Persist changes to localStorage whenever relevant state changes
  useEffect(() => {
    try {
      const data = { filters, onlyWithPrice, sort }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore write errors
    }
  }, [filters, onlyWithPrice, sort])

  const state: CatalogFiltersState = {
    filters,
    onlyWithPrice,
    sort,
    setFilters,
    setOnlyWithPrice,
    setSort,
  }

  // Apply selector if provided
  const selected = selector(state)
  return selected
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
