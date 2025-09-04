import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCatalogFilters, SortOrder } from '@/state/catalogFilters'
import type { FacetFilters } from '@/services/catalog'

export function useSyncFiltersWithUrl() {
  const [params, setParams] = useSearchParams()
  const { filters, setFilters, sort, setSort } = useCatalogFilters((s) => ({
    filters: s.filters,
    setFilters: s.setFilters,
    sort: s.sort,
    setSort: s.setSort,
  }))

  // Load initial state from URL on mount
  useEffect(() => {
    const urlFilters: Partial<FacetFilters> = {}
    let hasChanges = false

    const q = params.get('q')
    if (q && q !== filters.search) {
      urlFilters.search = q
      hasChanges = true
    }

    const availability = params.get('availability')
    if (availability && availability !== filters.availability) {
      urlFilters.availability = availability
      hasChanges = true
    }

    const suppliers = params.get('suppliers')
    if (suppliers) {
      const supplierArray = suppliers.split(',').filter(Boolean)
      const currentSuppliers = filters.supplier || []
      if (JSON.stringify(supplierArray) !== JSON.stringify(currentSuppliers)) {
        urlFilters.supplier = supplierArray
        hasChanges = true
      }
    }

    const brand = params.get('brand')
    if (brand && brand !== filters.brand) {
      urlFilters.brand = brand
      hasChanges = true
    }

    const category = params.get('category')
    if (category && category !== filters.category) {
      urlFilters.category = category
      hasChanges = true
    }

    const packSizeRange = params.get('packSizeRange')
    if (packSizeRange && packSizeRange !== filters.packSizeRange) {
      urlFilters.packSizeRange = packSizeRange
      hasChanges = true
    }

    if (hasChanges) {
      setFilters(urlFilters)
    }

    const sortParam = params.get('sort')
    if (sortParam && sortParam !== sort) {
      const validSorts: SortOrder[] = ['relevance', 'price_asc', 'price_desc', 'az', 'recent']
      if (validSorts.includes(sortParam as SortOrder)) {
        setSort(sortParam as SortOrder)
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync state back to URL
  useEffect(() => {
    const p = new URLSearchParams()
    
    if (filters.search) p.set('q', filters.search)
    if (filters.availability) p.set('availability', filters.availability)
    if (filters.supplier?.length) p.set('suppliers', filters.supplier.join(','))
    if (filters.brand) p.set('brand', filters.brand)
    if (filters.category) p.set('category', filters.category)
    if (filters.packSizeRange) p.set('packSizeRange', filters.packSizeRange)
    if (sort && sort !== 'relevance') p.set('sort', sort)
    
    setParams(p, { replace: true })
  }, [
    filters.search,
    filters.availability,
    filters.supplier,
    filters.brand,
    filters.category,
    filters.packSizeRange,
    sort,
    setParams,
  ])
}

export default useSyncFiltersWithUrl

