export type Tri = -1 | 0 | 1 // exclude, neutral, include

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
