import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { shallow } from 'zustand/vanilla/shallow'
import type { FacetFilters } from '@/services/catalog'

// Zustand store managing catalog filter state. Utility helpers have been
// consolidated in "@/lib/catalogFilters" to keep this module focused on state.

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

// Legacy tri-state for backward compatibility
export type TriState = 'off' | 'include' | 'exclude'

interface CatalogFiltersState {
  /** Current facet filters applied to the catalog */
  filters: FacetFilters
  /** Whether to show only items with price information */
  onlyWithPrice: boolean
  /** Tier-1 toggles - simple boolean filters (NEW) */
  inStock: boolean
  mySuppliers: boolean
  onSpecial: boolean
  hasPrice: boolean
  /** Selected sort order */
  sort: SortOrder
  setFilters: (f: Partial<FacetFilters>) => void
  setOnlyWithPrice: (v: boolean) => void
  setInStock: (v: boolean) => void
  setMySuppliers: (v: boolean) => void
  setOnSpecial: (v: boolean) => void
  setHasPrice: (v: boolean) => void
  setSort: (v: SortOrder) => void
  applyAdvancedFilter: (category: string, value: string | boolean | number, action?: 'add' | 'remove' | 'set') => void
  clear: () => void
}

type FacetArrayKey = Extract<keyof FacetFilters, 'brand' | 'category' | 'supplier' | 'availability'>

const FACET_ARRAY_KEYS: FacetArrayKey[] = ['brand', 'category', 'supplier', 'availability']

function normalizeIncludeExclude(value: unknown): { include: string[]; exclude: string[] } | undefined {
  if (value == null) return undefined

  // Already in correct format
  if (typeof value === 'object' && !Array.isArray(value) && 'include' in value && 'exclude' in value) {
    const obj = value as { include: unknown; exclude: unknown }
    const include = Array.isArray(obj.include) ? obj.include.map(v => String(v).trim()).filter(Boolean) : []
    const exclude = Array.isArray(obj.exclude) ? obj.exclude.map(v => String(v).trim()).filter(Boolean) : []
    if (include.length === 0 && exclude.length === 0) return undefined
    return { include, exclude }
  }

  // Legacy array format - convert to include-only
  if (Array.isArray(value)) {
    const include = value.map(entry => `${entry}`.trim()).filter((entry): entry is string => entry.length > 0)
    if (include.length === 0) return undefined
    return { include, exclude: [] }
  }

  // String format - convert to include-only
  if (typeof value === 'string') {
    const include = value
      .split(',')
      .map(entry => entry.trim())
      .filter((entry): entry is string => entry.length > 0)
    if (include.length === 0) return undefined
    return { include, exclude: [] }
  }

  return undefined
}

function normalizePackSizeRange(
  value: unknown,
): FacetFilters['packSizeRange'] | undefined {
  if (value == null) return value === null ? null : undefined
  if (typeof value !== 'object') return undefined

  const range = value as { min?: unknown; max?: unknown }
  const min = range.min ?? undefined
  const max = range.max ?? undefined

  const parseNumber = (raw: unknown): number | undefined => {
    if (raw == null || raw === '') return undefined
    const numeric = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(numeric) ? numeric : undefined
  }

  const minValue = parseNumber(min)
  const maxValue = parseNumber(max)

  if (minValue == null && maxValue == null) return undefined

  return {
    ...(minValue != null ? { min: minValue } : {}),
    ...(maxValue != null ? { max: maxValue } : {}),
  }
}

function normalizeFacetFiltersPatch(
  patch: Partial<FacetFilters>,
): Partial<FacetFilters> {
  const normalized: Partial<FacetFilters> = {}

  if ('search' in patch) {
    const value = patch.search
    normalized.search = typeof value === 'string' ? value : undefined
  }

  for (const key of FACET_ARRAY_KEYS) {
    if (!(key in patch)) continue
    const rawValue = patch[key]
    if (rawValue == null) {
      normalized[key] = undefined
      continue
    }
    if (key === 'availability') {
      // availability stays as simple string array
      if (Array.isArray(rawValue)) {
        normalized[key] = rawValue.map(v => String(v).trim()).filter(Boolean) as any
      }
    } else {
      // brand, category, supplier use include/exclude
      const result = normalizeIncludeExclude(rawValue)
      normalized[key] = result ?? undefined
    }
  }

  if ('packSizeRange' in patch) {
    const value = patch.packSizeRange
    if (value === null) {
      normalized.packSizeRange = null
    } else if (value === undefined) {
      normalized.packSizeRange = undefined
    } else {
      normalized.packSizeRange = normalizePackSizeRange(value)
    }
  }

  return normalized
}

function normalizeFacetFiltersState(filters: unknown): FacetFilters {
  const source = (filters ?? {}) as Partial<FacetFilters>
  const normalizedPatch = normalizeFacetFiltersPatch(source)
  const normalized: FacetFilters = {}

  if ('search' in normalizedPatch) normalized.search = normalizedPatch.search

  for (const key of FACET_ARRAY_KEYS) {
    const value = normalizedPatch[key]
    if (value != null) {
      if (key === 'availability' && Array.isArray(value)) {
        normalized[key] = value as any
      } else if (key !== 'availability' && typeof value === 'object' && 'include' in value) {
        normalized[key] = value as any
      }
    }
  }

  if ('packSizeRange' in normalizedPatch) {
    normalized.packSizeRange = normalizedPatch.packSizeRange ?? undefined
  } else if (source.packSizeRange != null) {
    const range = normalizePackSizeRange(source.packSizeRange)
    if (range !== undefined) normalized.packSizeRange = range
  }

  return normalized
}

function mergeFilters(
  current: FacetFilters,
  patch: Partial<FacetFilters>,
): FacetFilters {
  const normalizedPatch = normalizeFacetFiltersPatch(patch)
  const next: FacetFilters = { ...current }

  if ('search' in normalizedPatch) {
    if (normalizedPatch.search === undefined) delete next.search
    else next.search = normalizedPatch.search
  }

  for (const key of FACET_ARRAY_KEYS) {
    if (!(key in normalizedPatch)) continue
    const value = normalizedPatch[key]
    if (value == null) {
      delete next[key]
    } else {
      // Type assertion needed because TypeScript can't narrow the union properly
      ;(next as any)[key] = value
    }
  }

  if ('packSizeRange' in normalizedPatch) {
    const range = normalizedPatch.packSizeRange
    if (range === undefined) delete next.packSizeRange
    else next.packSizeRange = range
  }

  return next
}

const defaultState: Omit<
  CatalogFiltersState,
  | 'setFilters'
  | 'setOnlyWithPrice'
  | 'setInStock'
  | 'setMySuppliers'
  | 'setOnSpecial'
  | 'setHasPrice'
  | 'setSort'
  | 'applyAdvancedFilter'
  | 'clear'
> = {
  filters: {},
  onlyWithPrice: false,
  inStock: false,
  mySuppliers: false,
  onSpecial: false,
  hasPrice: false,
  sort: 'relevance',
}

export const useCatalogFilters = create<CatalogFiltersState>()(
  persist(
    set => ({
      ...defaultState,
      setFilters: f =>
        set(state => {
          const merged = mergeFilters(state.filters, f)
          const hasChanges = JSON.stringify(state.filters) !== JSON.stringify(merged)
          return hasChanges ? { filters: merged } : state
        }),
      setOnlyWithPrice: v => set({ onlyWithPrice: v }),
      setInStock: v => set(state => (state.inStock === v ? state : { inStock: v })),
      setMySuppliers: v => set(state => (state.mySuppliers === v ? state : { mySuppliers: v })),
      setOnSpecial: v => set(state => (state.onSpecial === v ? state : { onSpecial: v })),
      setHasPrice: v => set(state => (state.hasPrice === v ? state : { hasPrice: v })),
      setSort: v => set({ sort: v }),
      applyAdvancedFilter: (category, value, action = 'set') =>
        set(state => {
          const newFilters = { ...state.filters }
          
          if (category === 'dietary' || category === 'quality' || category === 'lifecycle') {
            const current = (newFilters[category] as string[] | undefined) || []
            if (action === 'add' && typeof value === 'string') {
              (newFilters as any)[category] = [...current, value]
            } else if (action === 'remove' && typeof value === 'string') {
              (newFilters as any)[category] = current.filter(v => v !== value)
            }
          } else if (category === 'operational') {
            const current = newFilters.operational || { caseBreak: false, directDelivery: false, sameDay: false }
            if (typeof value === 'object' && value !== null) {
              newFilters.operational = { ...current, ...(value as any) }
            }
          } else if (category === 'dataQuality') {
            const current = newFilters.dataQuality || { hasImage: false, hasPrice: false, hasDescription: false }
            if (typeof value === 'object' && value !== null) {
              newFilters.dataQuality = { ...current, ...(value as any) }
            }
          }
          
          return { filters: newFilters }
        }),
      clear: () => set({ ...defaultState }),
    }),
    {
      name: 'catalogFilters',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<CatalogFiltersState> | undefined
        if (!persisted) return currentState
        return {
          ...currentState,
          ...persisted,
          filters: normalizeFacetFiltersState(persisted.filters ?? currentState.filters),
        }
      },
    },
  ),
)

export { shallow }

