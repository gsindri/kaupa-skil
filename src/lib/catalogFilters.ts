export type Tri = -1 | 0 | 1 // exclude, neutral, include

export type TriState = 'off' | 'include' | 'exclude'

export type IncludeExclude = 'include' | 'exclude' | null

export interface CatalogFilters {
  q?: string
  availability?: 'all' | 'in_stock' | 'preorder'
  categories?: string[]
  brands?: { include: string[]; exclude: string[] }
  suppliers?: Record<string, Tri>
  price?: { min?: number; max?: number }
  packSizes?: string[]
}

export const createEmptyFilters = (): CatalogFilters => ({
  availability: 'all',
  categories: [],
  brands: { include: [], exclude: [] },
  suppliers: {},
})

export function toggleArray<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

export function toggleTri(current: Tri | undefined, mode: 'include'|'exclude'|'cycle'): Tri {
  const v = current ?? 0
  if (mode === 'include') return v === 1 ? 0 : 1
  if (mode === 'exclude') return v === -1 ? 0 : -1
  return v === 0 ? 1 : v === 1 ? -1 : 0
}

/**
 * Cycle through include/exclude/remove states for filter chips
 * Click cycles: include → exclude → remove (null)
 */
export function cycleIncludeExclude(current: IncludeExclude): IncludeExclude {
  if (current === 'include') return 'exclude'
  if (current === 'exclude') return null
  return 'include'
}

/**
 * Legacy helper for tri-state stock availability mapping
 * @deprecated Use boolean inStock filter instead
 */
export function triStockToAvailability(tri: TriState): string[] | undefined {
  switch (tri) {
    case 'include':
      return ['IN_STOCK']
    case 'exclude':
      return ['OUT_OF_STOCK']
    default:
      return undefined
  }
}
