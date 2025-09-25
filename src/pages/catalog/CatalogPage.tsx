import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { rememberScroll, restoreScroll } from '@/lib/scrollMemory'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { InfiniteSentinel } from '@/components/common/InfiniteSentinel'
import { FilterChip } from '@/components/ui/filter-chip'
import { TriStateChip } from '@/components/ui/tri-state-chip'
import { CatalogFiltersPanel } from '@/components/catalog/CatalogFiltersPanel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FacetFilters, PublicCatalogFilters, OrgCatalogFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'

import AppLayout from '@/components/layout/AppLayout'
import { useCatalogFilters, SortOrder } from '@/state/catalogFiltersStore'
import type { TriState } from '@/lib/catalogFilters'
import { triStockToAvailability } from '@/lib/catalogFilters'
import { useCart } from '@/contexts/useBasket'
import type { CartItem } from '@/lib/types'
import { resolveImage } from '@/lib/images'
import { useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, FunnelSimple, XCircle } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const FILTER_PANEL_LS_KEY = 'catalog-filters-open'

interface DerivedChip {
  key: string
  label: string
  onRemove: () => void
  onEdit: () => void
}

function deriveChipsFromFilters(
  filters: FacetFilters,
  setFilters: (f: Partial<FacetFilters>) => void,
  openFacet: (facet: keyof FacetFilters) => void,
): DerivedChip[] {
  const chips: DerivedChip[] = []

  if (filters.category && filters.category.length) {
    if (filters.category.length <= 2) {
      filters.category.forEach(id => {
        chips.push({
          key: `category-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ category: filters.category!.filter(categoryId => categoryId !== id) }),
          onEdit: () => openFacet('category'),
        })
      })
    } else {
      chips.push({
        key: 'category',
        label: `Categories (${filters.category.length})`,
        onRemove: () => setFilters({ category: undefined }),
        onEdit: () => openFacet('category'),
      })
    }
  }

  if (filters.supplier && filters.supplier.length) {
    if (filters.supplier.length <= 2) {
      filters.supplier.forEach(id => {
        chips.push({
          key: `supplier-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ supplier: filters.supplier!.filter(supplierId => supplierId !== id) }),
          onEdit: () => openFacet('supplier'),
        })
      })
    } else {
      const [first, second, ...rest] = filters.supplier
      ;[first, second].forEach(id => {
        chips.push({
          key: `supplier-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ supplier: filters.supplier!.filter(supplierId => supplierId !== id) }),
          onEdit: () => openFacet('supplier'),
        })
      })
      chips.push({
        key: 'supplier-extra',
        label: `Suppliers (+${rest.length})`,
        onRemove: () => setFilters({ supplier: undefined }),
        onEdit: () => openFacet('supplier'),
      })
    }
  }

  if (filters.brand && filters.brand.length) {
    if (filters.brand.length <= 2) {
      filters.brand.forEach(id => {
        chips.push({
          key: `brand-${id}`,
          label: id,
          onRemove: () => setFilters({ brand: filters.brand!.filter(brandId => brandId !== id) }),
          onEdit: () => openFacet('brand'),
        })
      })
    } else {
      chips.push({
        key: 'brand',
        label: `Brands (${filters.brand.length})`,
        onRemove: () => setFilters({ brand: undefined }),
        onEdit: () => openFacet('brand'),
      })
    }
  }

  if (filters.packSizeRange) {
    const { min, max } = filters.packSizeRange
    let label = 'Pack'
    if (min != null && max != null) label += ` ${min}-${max}`
    else if (min != null) label += ` ≥ ${min}`
    else if (max != null) label += ` ≤ ${max}`
    chips.push({
      key: 'packSizeRange',
      label,
      onRemove: () => setFilters({ packSizeRange: undefined }),
      onEdit: () => openFacet('packSizeRange'),
    })
  }

  return chips
}

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''

  // Direct access to avoid shallow comparison issues
  const filters = useCatalogFilters(s => s.filters)
  const setFilters = useCatalogFilters(s => s.setFilters)
  const onlyWithPrice = useCatalogFilters(s => s.onlyWithPrice)
  const setOnlyWithPrice = useCatalogFilters(s => s.setOnlyWithPrice)
  const sortOrder = useCatalogFilters(s => s.sort)
  const setSortOrder = useCatalogFilters(s => s.setSort)
  const triStock = useCatalogFilters(s => s.triStock)
  const setTriStock = useCatalogFilters(s => s.setTriStock)
  const triSpecial = useCatalogFilters(s => s.triSpecial)
  const setTriSpecial = useCatalogFilters(s => s.setTriSpecial)
  const triSuppliers = useCatalogFilters(s => s.triSuppliers)
  const setTriSuppliers = useCatalogFilters(s => s.setTriSuppliers)

  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<'grid' | 'list'>(() => {
    const param = searchParams.get('view')
    if (param === 'grid' || param === 'list') return param
    try {
      const stored = localStorage.getItem('catalog:view')
      if (stored === 'grid' || stored === 'list') return stored
    } catch {
      /* ignore */
    }
    return 'grid'
  })
  const viewKey = `catalog:${view}`
  // Removed separate products state - using data directly from hooks
  const [selected, setSelected] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const { addItem } = useCart()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'supplier' | 'price' | 'availability'
    direction: 'asc' | 'desc'
  } | null>({ key: 'name', direction: 'asc' })
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const [showFilters, setShowFilters] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(FILTER_PANEL_LS_KEY)
      if (stored !== null) {
        return stored === 'true'
      }
    } catch {
      /* ignore */
    }
    return false
  })
  const [focusedFacet, setFocusedFacet] = useState<keyof FacetFilters | null>(null)
  const clearAllFilters = useCallback(() => {
    setTriStock('off')
    setTriSuppliers('off')
    setTriSpecial('off')
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
      availability: undefined,
    })
    setFocusedFacet(null)
  }, [
    setFilters,
    setFocusedFacet,
    setOnlyWithPrice,
    setTriSpecial,
    setTriStock,
    setTriSuppliers,
  ])
  const stringifiedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('catalog:view', view)
    } catch {
      /* ignore */
    }
  }, [view])

  useEffect(() => {
    restoreScroll(viewKey)
  }, [viewKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateScrolled = () => {
      const shouldBeScrolled = window.scrollY > 0
      setScrolled(prev => (prev === shouldBeScrolled ? prev : shouldBeScrolled))
    }
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  // Will be calculated after products are defined
  // hideConnectPill will be calculated after products are defined

  // Read initial sort from URL on mount
  useEffect(() => {
    const param = searchParams.get('sort')
    if (param) setSortOrder(param as SortOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial stock filter from URL on mount
  useEffect(() => {
    const param = searchParams.get('stock')
    if (param === 'include' || param === 'exclude') {
      setTriStock(param as TriState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial facet filters and toggles from URL on mount
  useEffect(() => {
    const f: Partial<FacetFilters> = {}
    const categories = searchParams.get('categories')
    const brands = searchParams.get('brands')
    const suppliers = searchParams.get('suppliers')
    const pack = searchParams.get('pack')
    if (categories) f.category = categories.split(',').filter(Boolean)
    if (brands) f.brand = brands.split(',').filter(Boolean)
    if (suppliers) f.supplier = suppliers.split(',').filter(Boolean)
    if (pack) {
      const [minStr, maxStr] = pack.split('-')
      const min = minStr ? Number(minStr) : undefined
      const max = maxStr ? Number(maxStr) : undefined
      f.packSizeRange = { min, max }
    }
    if (Object.keys(f).length) setFilters(f)
    const suppliersParam = searchParams.get('mySuppliers')
    const specialParam = searchParams.get('special')
    if (suppliersParam === 'include' || suppliersParam === 'exclude') {
      setTriSuppliers(suppliersParam as TriState)
    }
    if (specialParam === 'include' || specialParam === 'exclude') {
      setTriSpecial(specialParam as TriState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist sort selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('sort')
    if (sortOrder === 'relevance') {
      if (current) {
        params.delete('sort')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== sortOrder) {
      params.set('sort', sortOrder)
      setSearchParams(params, { replace: true })
    }
  }, [sortOrder, searchParams, setSearchParams])

  // Persist stock selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('stock')
    if (triStock === 'off') {
      if (current) {
        params.delete('stock')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triStock) {
      params.set('stock', triStock)
      setSearchParams(params, { replace: true })
    }
  }, [triStock, searchParams, setSearchParams])

  // Persist my suppliers selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('mySuppliers')
    if (triSuppliers === 'off') {
      if (current) {
        params.delete('mySuppliers')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triSuppliers) {
      params.set('mySuppliers', triSuppliers)
      setSearchParams(params, { replace: true })
    }
  }, [triSuppliers, searchParams, setSearchParams])

  // Persist special selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('special')
    if (triSpecial === 'off') {
      if (current) {
        params.delete('special')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triSpecial) {
      params.set('special', triSpecial)
      setSearchParams(params, { replace: true })
    }
  }, [triSpecial, searchParams, setSearchParams])

  // Persist facet filters to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let changed = false
    const updateParam = (key: string, value: string | null) => {
      const cur = params.get(key)
      if (value && cur !== value) {
        params.set(key, value)
        changed = true
      } else if (!value && cur) {
        params.delete(key)
        changed = true
      }
    }
    updateParam('categories', filters.category?.join(',') || null)
    updateParam('suppliers', filters.supplier?.join(',') || null)
    updateParam('brands', filters.brand?.join(',') || null)
    const packValue =
      filters.packSizeRange && (filters.packSizeRange.min != null || filters.packSizeRange.max != null)
        ? `${filters.packSizeRange.min ?? ''}-${filters.packSizeRange.max ?? ''}`
        : null
    updateParam('pack', packValue)
    if (changed) setSearchParams(params, { replace: true })
  }, [filters, searchParams, setSearchParams])

  useEffect(() => {
    // No longer need to reset products here - hooks handle this internally
  }, [
    debouncedSearch,
    onlyWithPrice,
    orgId,
    triStock,
    triSuppliers,
    triSpecial,
    sortOrder,
    stringifiedFilters,
  ])

  useEffect(() => {
    if (sortOrder === 'az') {
      setTableSort({ key: 'name', direction: 'asc' })
    } else {
      setTableSort(null)
    }
  }, [sortOrder])

  const availability = triStockToAvailability(triStock)

  const publicFilters: PublicCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      ...(onlyWithPrice ? { onlyWithPrice: true } : {}),
      ...(triSpecial !== 'off'
        ? { onSpecial: triSpecial === 'include' }
        : {}),
      ...(availability ? { availability } : {}),
    }),
    [filters, debouncedSearch, onlyWithPrice, triSpecial, availability],
  )
  const orgFilters: OrgCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      onlyWithPrice,
      ...(triSuppliers !== 'off' ? { mySuppliers: triSuppliers } : {}),
      ...(triSpecial !== 'off'
        ? { onSpecial: triSpecial === 'include' }
        : {}),
      ...(availability ? { availability } : {}),
    }),
    [
      filters,
      debouncedSearch,
      onlyWithPrice,
      triSuppliers,
      triSpecial,
      availability,
    ],
  )

  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)

  // Use data directly from the appropriate hook
  const currentQuery = orgId ? orgQuery : publicQuery
  const products = useMemo(() => currentQuery.data ?? [], [currentQuery.data])
  const nextCursor = currentQuery.nextCursor
  const totalCount = currentQuery.total
  const isFetching = currentQuery.isFetching
  const error = currentQuery.error

  const unconnectedPercentage = useMemo(() => {
    if (!products.length) return 0
    const missing = products.filter(p => !p.supplier_ids?.length).length
    return (missing / products.length) * 100
  }, [products])
  
  const hideConnectPill = unconnectedPercentage > 70

  useEffect(() => {
    logFilter({
      ...filters,
      onlyWithPrice,
      triStock,
      mySuppliers: triSuppliers,
      sort: sortOrder,
    })
  }, [filters, onlyWithPrice, triStock, triSuppliers, sortOrder])

  useEffect(() => {
    if (debouncedSearch) logSearch(debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    if (filters.brand?.length) logFacetInteraction('brand', filters.brand.join(','))
    if (filters.category?.length) logFacetInteraction('category', filters.category.join(','))
    if (filters.supplier?.length)
      logFacetInteraction('supplier', filters.supplier.join(','))
    if (filters.packSizeRange)
      logFacetInteraction('packSizeRange', JSON.stringify(filters.packSizeRange))
  }, [filters.brand, filters.category, filters.supplier, filters.packSizeRange])

  useEffect(() => {
    logFacetInteraction('onlyWithPrice', onlyWithPrice)
  }, [onlyWithPrice])

  useEffect(() => {
    logFacetInteraction('mySuppliers', triSuppliers)
  }, [triSuppliers])

  useEffect(() => {
    logFacetInteraction('special', triSpecial)
  }, [triSpecial])

  useEffect(() => {
    logFacetInteraction('sort', sortOrder)
  }, [sortOrder])

  useEffect(() => {
    if (error) {
      console.error(error)
      AnalyticsTracker.track('catalog_error', {
        message: String(error),
        orgId: orgId || 'public',
      })
    }
  }, [error, orgId])

  useEffect(() => {
    if (
      (orgQuery.isFetched || publicQuery.isFetched) &&
      products.length === 0 &&
      debouncedSearch
    ) {
      logZeroResults(debouncedSearch, {
        ...filters,
        onlyWithPrice,
        triStock,
        mySuppliers: triSuppliers,
        sort: sortOrder,
      })
    }
  }, [
    orgQuery.isFetched,
    publicQuery.isFetched,
    products.length,
    debouncedSearch,
    filters,
    onlyWithPrice,
    triStock,
    triSuppliers,
    sortOrder,
  ])

  const isLoading = isFetching
  const loadingMore = isLoading && nextCursor !== null

  const handleLoadMore = useCallback(() => {
    console.log('CatalogPage: handleLoadMore called, nextCursor:', nextCursor)
    if (currentQuery.hasNextPage && !currentQuery.isFetchingNextPage) {
      console.log('CatalogPage: Calling loadMore')
      currentQuery.loadMore()
    }
  }, [nextCursor, currentQuery])

  const sortedProducts = useMemo(() => {
    if (!tableSort) return products
    const sorted = [...products]
    const availabilityOrder: Record<string, number> = {
      IN_STOCK: 0,
      LOW_STOCK: 1,
      OUT_OF_STOCK: 2,
      UNKNOWN: 3,
    }
    sorted.sort((a, b) => {
      let av: any
      let bv: any
      switch (tableSort.key) {
        case 'supplier':
          av = (a.supplier_ids?.[0] || '').toLowerCase()
          bv = (b.supplier_ids?.[0] || '').toLowerCase()
          break
        case 'price':
          av = a.best_price ?? (tableSort.direction === 'asc' ? Infinity : -Infinity)
          bv = b.best_price ?? (tableSort.direction === 'asc' ? Infinity : -Infinity)
          break
        case 'availability':
          av = availabilityOrder[a.availability_status] ?? 3
          bv = availabilityOrder[b.availability_status] ?? 3
          break
        default:
          av = (a.name || '').toLowerCase()
          bv = (b.name || '').toLowerCase()
      }
      if (av < bv) return tableSort.direction === 'asc' ? -1 : 1
      if (av > bv) return tableSort.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [products, tableSort])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(sortedProducts.map(p => p.catalog_id))
    } else {
      setSelected([])
    }
  }

  const handleSort = (
    key: 'name' | 'supplier' | 'price' | 'availability',
  ) => {
    setTableSort(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleFilterChange = (f: Partial<FacetFilters>) => {
    setFilters(f)
  }

  const handleAdd = (product: any, selectedSupplierId?: string) => {
    const supplierIds = Array.isArray(product.supplier_ids)
      ? (product.supplier_ids as unknown[]).filter(
          (value): value is string => typeof value === 'string' && value.length > 0,
        )
      : []
    const supplierNames = Array.isArray(product.supplier_names)
      ? (product.supplier_names as unknown[]).filter(
          (value): value is string => typeof value === 'string' && value.length > 0,
        )
      : []
    const supplierEntries = Array.isArray(product.suppliers)
      ? product.suppliers.filter(Boolean)
      : []

    const extractId = (entry: any): string => {
      if (!entry) return ''
      if (typeof entry === 'string') return entry
      return (
        entry.supplier_id ??
        entry.id ??
        entry.supplierId ??
        entry.supplier?.id ??
        ''
      )
    }

    const extractName = (entry: any): string => {
      if (!entry) return ''
      if (typeof entry === 'string') return entry
      return (
        entry.supplier_name ??
        entry.name ??
        entry.displayName ??
        entry.supplier?.name ??
        ''
      )
    }

    let supplierId =
      typeof selectedSupplierId === 'string' && selectedSupplierId.length > 0
        ? selectedSupplierId
        : undefined

    if (!supplierId && supplierIds.length) {
      supplierId = supplierIds[0]
    }

    if (!supplierId && supplierEntries.length) {
      supplierId = extractId(supplierEntries[0]) || undefined
    }

    if (!supplierId) {
      supplierId = ''
    }

    const findNameForId = (id: string): string => {
      if (!id) return ''
      const index = supplierIds.indexOf(id)
      if (index !== -1) {
        const candidate = supplierNames[index]
        if (candidate) return candidate
      }
      const supplierMatch = supplierEntries.find(entry => extractId(entry) === id)
      if (supplierMatch) {
        const candidate = extractName(supplierMatch)
        if (candidate) return candidate
      }
      return ''
    }

    let supplierName = findNameForId(supplierId)

    if (!supplierName && supplierNames.length) {
      supplierName = supplierNames[0]
    }

    if (!supplierName && supplierEntries.length) {
      supplierName = extractName(supplierEntries[0])
    }

    if (!supplierName && supplierId) {
      supplierName = supplierId
    }

    const item: Omit<CartItem, 'quantity'> = {
      id: product.catalog_id,
      supplierId,
      supplierName: supplierName || supplierId || '',
      itemName: product.name,
      sku: product.catalog_id,
      packSize: product.pack_size || '',
      packPrice: product.best_price ?? 0,
      unitPriceExVat: product.best_price ?? 0,
      unitPriceIncVat: product.best_price ?? 0,
      vatRate: 0,
      unit: '',
      supplierItemId: product.catalog_id,
      displayName: product.name,
      packQty: 1,
      image: resolveImage(
        product.sample_image_url,
        product.availability_status,
      ),
    }
    setAddingId(product.catalog_id)
    addItem(item, 1)
    setTimeout(() => setAddingId(null), 500)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const shouldBeScrolled = window.scrollY > 0
    setScrolled(prev => (prev === shouldBeScrolled ? prev : shouldBeScrolled))
  }, [view])

  const total = totalCount

  const sharedContainerClass = 'mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-12'
  const containerClass = cn(sharedContainerClass)
  const contentContainerClass = cn(sharedContainerClass, 'space-y-6')

  return (
    <AppLayout
      headerRef={headerRef}
      header={
        <FiltersBar
          filters={filters}
          setFilters={setFilters}
          onlyWithPrice={onlyWithPrice}
          setOnlyWithPrice={setOnlyWithPrice}
          triStock={triStock}
          setTriStock={setTriStock}
          triSpecial={triSpecial}
          setTriSpecial={setTriSpecial}
          triSuppliers={triSuppliers}
          setTriSuppliers={setTriSuppliers}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          view={view}
          setView={setView}
          error={error}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          focusedFacet={focusedFacet}
          setFocusedFacet={setFocusedFacet}
          total={total}
          scrolled={scrolled}
        />
      }
      secondary={
        showFilters ? (
          <div id="catalog-filters-panel">
            <CatalogFiltersPanel
              filters={filters}
              onChange={setFilters}
              focusedFacet={focusedFacet}
              onClearFilters={clearAllFilters}
            />
          </div>
        ) : null
      }
      panelOpen={showFilters}
    >

      {view === 'list' ? (
        <div className={contentContainerClass}>
          {hideConnectPill && !bannerDismissed && (
            <div
              role="status"
              data-testid="alert"
              className="flex items-center justify-between rounded-[var(--ctrl-r,12px)] bg-white/12 px-4 py-3 text-sm text-[color:var(--ink)] ring-1 ring-inset ring-white/15 shadow-[0_18px_40px_rgba(3,10,26,0.4)] backdrop-blur-xl"
            >
              <span>Connect suppliers to unlock prices.</span>
              <button
                type="button"
                aria-label="Dismiss notice"
                onClick={() => setBannerDismissed(true)}
                className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-[color:var(--ink-dim)]/80 transition duration-150 ease-out hover:bg-white/10 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transition-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {bulkMode && (
            <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background py-2 text-sm">
              <span>{selected.length} selected</span>
              <Button variant="ghost" onClick={() => { setBulkMode(false); setSelected([]) }}>
                Done
              </Button>
            </div>
          )}
          <CatalogTable
            products={sortedProducts}
            selected={selected}
            onSelect={toggleSelect}
            onSelectAll={handleSelectAll}
            sort={tableSort}
            onSort={handleSort}
            isBulkMode={bulkMode}
          />
          <InfiniteSentinel
            onVisible={handleLoadMore}
            disabled={!nextCursor || loadingMore}
            root={null}
            rootMargin="800px"
          />
          {loadingMore && (
            <div className="py-6 text-center text-muted-foreground">Loading more…</div>
          )}
        </div>
      ) : (
        <div className={contentContainerClass}>
          <CatalogGrid
            products={sortedProducts}
            onAddToCart={handleAdd}
            onNearEnd={nextCursor ? handleLoadMore : undefined}
            showPrice
          />
        </div>
      )}
    </AppLayout>
  )
}

interface FiltersBarProps {
  filters: FacetFilters
  setFilters: (f: Partial<FacetFilters>) => void
  onlyWithPrice: boolean
  setOnlyWithPrice: (v: boolean) => void
  triStock: TriState
  setTriStock: (v: TriState) => void
  triSpecial: TriState
  setTriSpecial: (v: TriState) => void
  triSuppliers: TriState
  setTriSuppliers: (v: TriState) => void
  sortOrder: SortOrder
  setSortOrder: (v: SortOrder) => void
  view: 'grid' | 'list'
  setView: (v: 'grid' | 'list') => void
  error: unknown
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  focusedFacet: keyof FacetFilters | null
  setFocusedFacet: (f: keyof FacetFilters | null) => void
  onLockChange?: (locked: boolean) => void
  total: number | null
  scrolled: boolean
}

function FiltersBar({
  filters,
  setFilters,
  onlyWithPrice: _onlyWithPrice,
  setOnlyWithPrice,
  triStock,
  setTriStock,
  triSpecial,
  setTriSpecial,
  triSuppliers,
  setTriSuppliers,
  sortOrder,
  setSortOrder,
  view,
  setView,
  error,
  showFilters,
  setShowFilters,
  focusedFacet,
  setFocusedFacet,
  onLockChange,
  total,
  scrolled,
}: FiltersBarProps) {
  const { search: _search, ...facetFilters } = filters
  const chips = deriveChipsFromFilters(
    filters,
    setFilters,
    facet => {
      setFocusedFacet(facet)
      setShowFilters(true)
      onLockChange?.(true)
    },
  )
  const activeFacetCount = chips.length
  const activeCount =
    (triStock !== 'off' ? 1 : 0) +
    (triSuppliers !== 'off' ? 1 : 0) +
    (triSpecial !== 'off' ? 1 : 0) +
    activeFacetCount

  const clearAll = useCallback(() => {
    setTriStock('off')
    setTriSuppliers('off')
    setTriSpecial('off')
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
      availability: undefined,
    })
  }, [setTriStock, setTriSuppliers, setTriSpecial, setOnlyWithPrice, setFilters])

  const searchRef = useRef<HTMLInputElement>(null)
  const searchValue = filters.search ?? ''
  const showClear = searchValue.length > 0

  const formattedTotal = useMemo(() => {
    if (typeof total === 'number' && Number.isFinite(total)) {
      try {
        return new Intl.NumberFormat().format(total)
      } catch {
        return String(total)
      }
    }
    return null
  }, [total])

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ search: event.target.value })
    },
    [setFilters],
  )

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && searchValue) {
        event.preventDefault()
        setFilters({ search: '' })
        return
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'Backspace' || event.key === 'Delete')
      ) {
        event.preventDefault()
        if (searchValue) {
          setFilters({ search: '' })
        }
      }
    },
    [searchValue, setFilters],
  )

  const handleClearSearch = useCallback(() => {
    setFilters({ search: '' })
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [setFilters])

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_PANEL_LS_KEY, showFilters ? 'true' : 'false')
    } catch {
      /* ignore */
    }
  }, [showFilters])

  const toggleFilters = useCallback(() => {
    const next = !showFilters
    if (next) {
      const first = Object.entries(facetFilters).find(([, v]) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v),
      )?.[0] as keyof FacetFilters | undefined
      setFocusedFacet(first ?? null)
    } else {
      setFocusedFacet(null)
    }
    setShowFilters(next)
    onLockChange?.(next)
  }, [showFilters, facetFilters, setFocusedFacet, setShowFilters, onLockChange])

  const isEditableElement = (el: Element | null) => {
    if (!el) return false
    return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el as HTMLElement).isContentEditable
    )
  }

  useEffect(() => {
    const handleShortcuts = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      const key = event.key.toLowerCase()
      const active = document.activeElement

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        if (isEditableElement(active)) return
        event.preventDefault()
        onLockChange?.(true)
        searchRef.current?.focus()
        return
      }

      if (event.altKey || event.metaKey || event.ctrlKey) return
      if (isEditableElement(active)) return

      if (key === 'f') {
        event.preventDefault()
        toggleFilters()
        return
      }
      if (key === 'g') {
        event.preventDefault()
        if (view !== 'grid') setView('grid')
        return
      }
      if (key === 'l') {
        event.preventDefault()
        if (view !== 'list') setView('list')
      }
    }

    window.addEventListener('keydown', handleShortcuts)
    return () => window.removeEventListener('keydown', handleShortcuts)
  }, [toggleFilters, setView, view, onLockChange])

  return (
    <section
      className={cn(
        'relative bg-[color:var(--toolbar-bg)] backdrop-blur-xl ring-1 ring-inset ring-[color:var(--ring-idle)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/12 after:content-[""]',
        scrolled && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/16 before:opacity-70 before:content-[""]',
      )}
    >
      {error && (
        <div className={cn(containerClass, 'py-3')}>
          <Alert
            variant="destructive"
            className="rounded-[var(--ctrl-r,12px)] bg-white/12 text-[color:var(--ink)] ring-1 ring-inset ring-white/15 shadow-[0_16px_36px_rgba(3,10,22,0.45)] backdrop-blur-xl"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{String(error)}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className={containerClass}>
        <div className="flex h-[var(--toolbar-h,56px)] flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor="catalog-search">
                Search products
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <input
                    id="catalog-search"
                    ref={searchRef}
                    type="search"
                    placeholder="Search products"
                    aria-keyshortcuts="Control+K Meta+K"
                    value={searchValue}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => onLockChange?.(true)}
                    onBlur={() => onLockChange?.(false)}
                    className="h-[var(--ctrl-h,40px)] w-full rounded-[var(--ctrl-r,12px)] bg-white pl-12 pr-12 text-sm font-medium text-slate-900 placeholder:text-slate-500 ring-1 ring-inset ring-[color:var(--ring-idle)] shadow-[0_10px_32px_rgba(7,18,30,0.28)] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:ring-[color:var(--ring-hover)] motion-reduce:transition-none"
                  />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Search (Ctrl/⌘+K)</TooltipContent>
              </Tooltip>
              <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center text-slate-500">
                <MagnifyingGlass size={22} weight="fill" aria-hidden="true" />
              </span>
              {showClear && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition duration-150 ease-out hover:bg-slate-200/70 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-0 motion-reduce:transition-none"
                >
                  <XCircle size={20} weight="fill" />
                </button>
              )}
            </div>
            {formattedTotal && (
              <span className="flex-none text-xs font-medium leading-none text-[color:var(--ink-dim)] tabular-nums">
                {formattedTotal} results
              </span>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-3 sm:pl-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleFilters}
                  aria-pressed={showFilters}
                  aria-expanded={showFilters}
                  aria-controls="catalog-filters-panel"
                  aria-keyshortcuts="f"
                  className={cn(
                    'inline-flex h-[var(--ctrl-h,40px)] items-center gap-3 rounded-[var(--ctrl-r,12px)] bg-[color:var(--chip-bg)] px-3 text-sm font-semibold text-[color:var(--ink-hi)] ring-1 ring-inset ring-[color:var(--ring-idle)] backdrop-blur-xl transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--toolbar-bg)] hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] hover:ring-[color:var(--ring-hover)] motion-reduce:transition-none',
                    showFilters && 'bg-[color:var(--seg-active-bg)] text-[color:var(--ink-hi)] ring-[color:var(--ring-hover)]',
                  )}
                >
                  <FunnelSimple
                    size={24}
                    weight="fill"
                    className={cn('transition-opacity text-[color:var(--ink-hi)]', !showFilters && 'opacity-80')}
                  />
                  <span className="hidden sm:inline">
                    {activeCount ? `Filters (${activeCount})` : 'Filters'}
                  </span>
                  <span className="sm:hidden">Filters</span>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Filters (F)</TooltipContent>
            </Tooltip>

            <SortDropdown
              value={sortOrder}
              onChange={setSortOrder}
              onOpenChange={onLockChange}
              className="whitespace-nowrap"
            />

            <ViewToggle
              value={view}
              onChange={v => {
                rememberScroll(`catalog:${view}`)
                setView(v)
              }}
            />
          </div>
        </div>

        <div className="py-3">
          <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
            <TriStateChip
              state={triStock}
              onStateChange={setTriStock}
              includeLabel="In stock"
              excludeLabel="Out of stock"
              offLabel="All stock"
              includeAriaLabel="Filter: only in stock"
              excludeAriaLabel="Filter: out of stock"
              includeClassName="bg-emerald-400/25 text-emerald-50 ring-emerald-300/60 hover:bg-emerald-400/35"
              excludeClassName="bg-rose-400/25 text-rose-50 ring-rose-300/60 hover:bg-rose-400/35"
              className="shrink-0"
            />
            <TriStateChip
              state={triSuppliers}
              onStateChange={setTriSuppliers}
              includeLabel="My suppliers"
              excludeLabel="Not my suppliers"
              offLabel="All suppliers"
              includeAriaLabel="Filter: my suppliers only"
              excludeAriaLabel="Filter: not my suppliers"
              includeClassName="bg-sky-400/25 text-sky-50 ring-sky-300/60 hover:bg-sky-400/35"
              excludeClassName="bg-indigo-400/25 text-indigo-50 ring-indigo-300/60 hover:bg-indigo-400/35"
              className="shrink-0"
            />
            <TriStateChip
              state={triSpecial}
              onStateChange={setTriSpecial}
              includeLabel="On special"
              excludeLabel="Not on special"
              offLabel="All specials"
              includeAriaLabel="Filter: on special only"
              excludeAriaLabel="Filter: not on special"
              includeClassName="bg-amber-400/25 text-amber-50 ring-amber-300/60 hover:bg-amber-400/35"
              excludeClassName="bg-slate-500/30 text-slate-100 ring-slate-300/60 hover:bg-slate-500/40"
              className="shrink-0"
            />
            {chips.map(chip => (
              <FilterChip
                key={chip.key}
                selected
                onClick={chip.onEdit}
                onRemove={chip.onRemove}
                className="shrink-0"
              >
                {chip.label}
              </FilterChip>
            ))}
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 whitespace-nowrap text-sm font-medium text-[color:var(--ink-dim)]/80 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[color:var(--ink)]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
