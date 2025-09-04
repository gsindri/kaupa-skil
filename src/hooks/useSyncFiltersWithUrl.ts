import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCatalogFilters, AvailabilityFilter, SortKey } from '@/state/catalogFilters'

function parseAvailability(value: string | null): AvailabilityFilter[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is AvailabilityFilter =>
      v === 'in' || v === 'low' || v === 'out' || v === 'unknown',
    )
}

export function useSyncFiltersWithUrl() {
  const [params, setParams] = useSearchParams()
  const {
    search,
    availability,
    suppliers,
    specials,
    mySuppliersOnly,
    priceMin,
    priceMax,
    sort,
    setSearch,
    toggleAvailability,
    setSuppliers,
    setSpecials,
    setMySuppliersOnly,
    setPriceRange,
    setSort,
  } = useCatalogFilters((s) => s)

  // Load initial state from URL
  useEffect(() => {
    const q = params.get('q') || ''
    if (q) setSearch(q)

    const avail = parseAvailability(params.get('availability'))
    avail.forEach((a) => toggleAvailability(a))

    const supp = params.get('suppliers')
    if (supp) setSuppliers(supp.split(',').filter(Boolean))

    if (params.get('specials') === '1') setSpecials(true)
    if (params.get('my') === '1') setMySuppliersOnly(true)

    const min = params.get('priceMin')
    const max = params.get('priceMax')
    if (min || max) {
      setPriceRange(min ? Number(min) : undefined, max ? Number(max) : undefined)
    }

    const sortParam = params.get('sort')
    if (sortParam) {
      const [key, dir] = sortParam.split('.') as [SortKey, 'asc' | 'desc']
      setSort({ key, dir: dir === 'desc' ? 'desc' : 'asc' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync state back to URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (search) p.set('q', search)
    if (availability.length) p.set('availability', availability.join(','))
    if (suppliers.length) p.set('suppliers', suppliers.join(','))
    if (specials) p.set('specials', '1')
    if (mySuppliersOnly) p.set('my', '1')
    if (typeof priceMin === 'number') p.set('priceMin', String(priceMin))
    if (typeof priceMax === 'number') p.set('priceMax', String(priceMax))
    if (sort) p.set('sort', `${sort.key}.${sort.dir}`)
    setParams(p, { replace: true })
  }, [
    search,
    availability,
    suppliers,
    specials,
    mySuppliersOnly,
    priceMin,
    priceMax,
    sort,
    setParams,
  ])
}

export default useSyncFiltersWithUrl

