import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Mic, X } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { ProductCardSkeleton } from '@/components/catalog/ProductCardSkeleton'
import { HeroSearchInput } from '@/components/search/HeroSearchInput'
import { FilterChip } from '@/components/ui/filter-chip'
import { CatalogFiltersPanel } from '@/components/catalog/CatalogFiltersPanel'
import { ActiveFilterChips } from '@/components/catalog/ActiveFilterChips'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import type { FacetFilters, PublicCatalogFilters, OrgCatalogFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { LayoutDebugger } from '@/components/debug/LayoutDebugger'
import { FullWidthLayout } from '@/components/layout/FullWidthLayout'
import { useCatalogFilters, shallow, SortOrder } from '@/state/catalogFilters'
import { useCart } from '@/contexts/useBasket'
import type { CartItem } from '@/lib/types'
import { resolveImage } from '@/lib/images'
import { useSearchParams } from 'react-router-dom'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''

  const {
    filters,
    setFilters,
    onlyWithPrice,
    setOnlyWithPrice,
    sort: sortOrder,
    setSort: setSortOrder,
  } = useCatalogFilters(
    s => ({
      filters: s.filters,
      setFilters: s.setFilters,
      onlyWithPrice: s.onlyWithPrice,
      setOnlyWithPrice: s.setOnlyWithPrice,
      sort: s.sort,
      setSort: s.setSort,
    }),
    shallow,
  )

  const [searchParams, setSearchParams] = useSearchParams()

  const [inStock, setInStock] = useState(false)
  const [mySuppliers, setMySuppliers] = useState(false)
  const [onSpecial, setOnSpecial] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const lastCursor = useRef<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const { addItem } = useCart()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'supplier' | 'price' | 'availability'
    direction: 'asc' | 'desc'
  } | null>({ key: 'name', direction: 'asc' })
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [cols, setCols] = useState(1)
  const stringifiedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const unconnectedPercentage = useMemo(() => {
    if (!products.length) return 0
    const missing = products.filter(p => !p.suppliers?.length).length
    return (missing / products.length) * 100
  }, [products])
  const hideConnectPill = unconnectedPercentage > 70

  // Read initial sort from URL on mount
  useEffect(() => {
    const param = searchParams.get('sort')
    if (param) setSortOrder(param as SortOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist sort selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
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

  useEffect(() => {
    const updateCols = () => {
      if (!gridRef.current) return
      const width = gridRef.current.getBoundingClientRect().width
      let max = 4
      if (width >= 1800) max = 6
      const cols = Math.min(max, Math.floor(width / 320))
      setCols(cols)
    }

    if (view === 'grid') {
      const observer = new ResizeObserver(updateCols)
      const el = gridRef.current
      if (el) observer.observe(el)
      updateCols()
      return () => {
        if (el) observer.unobserve(el)
      }
    }
  }, [view])

  useEffect(() => {
    setProducts([])
    setCursor(null)
    setNextCursor(null)
    lastCursor.current = null
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [
    debouncedSearch,
    onlyWithPrice,
    orgId,
    inStock,
    mySuppliers,
    onSpecial,
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

  const publicFilters: PublicCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      ...(onlyWithPrice ? { onlyWithPrice: true } : {}),
      ...(inStock ? { inStock: true } : {}),
      ...(onSpecial ? { onSpecial: true } : {}),
      cursor,
    }),
    [filters, debouncedSearch, onlyWithPrice, inStock, onSpecial, cursor],
  )
  const orgFilters: OrgCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      onlyWithPrice,
      ...(mySuppliers ? { mySuppliers: true } : {}),
      ...(inStock ? { inStock: true } : {}),
      ...(onSpecial ? { onSpecial: true } : {}),
      cursor,
    }),
    [
      filters,
      debouncedSearch,
      onlyWithPrice,
      mySuppliers,
      inStock,
      onSpecial,
      cursor,
    ],
  )

  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)

  const {
    data: publicData,
    nextCursor: publicNext,
    isFetching: publicFetching,
    error: publicError,
    total: publicTotal,
  } = publicQuery
  const {
    data: orgData,
    nextCursor: orgNext,
    isFetching: orgFetching,
    error: orgError,
    total: orgTotal,
  } = orgQuery

  useEffect(() => {
    logFilter({
      ...filters,
      onlyWithPrice,
      inStock,
      mySuppliers,
      onSpecial,
      sort: sortOrder,
    })
  }, [filters, onlyWithPrice, inStock, mySuppliers, onSpecial, sortOrder])

  useEffect(() => {
    if (debouncedSearch) logSearch(debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    if (filters.brand) logFacetInteraction('brand', filters.brand)
    if (filters.category) logFacetInteraction('category', filters.category)
    if (filters.supplier?.length)
      logFacetInteraction('supplier', filters.supplier.join(','))
    if (filters.availability) logFacetInteraction('availability', filters.availability)
    if (filters.packSizeRange) logFacetInteraction('packSizeRange', filters.packSizeRange)
  }, [
    filters.brand,
    filters.category,
    filters.supplier,
    filters.availability,
    filters.packSizeRange,
  ])

  useEffect(() => {
    logFacetInteraction('onlyWithPrice', onlyWithPrice)
  }, [onlyWithPrice])

  useEffect(() => {
    logFacetInteraction('mySuppliers', mySuppliers)
  }, [mySuppliers])

  useEffect(() => {
    logFacetInteraction('onSpecial', onSpecial)
  }, [onSpecial])

  useEffect(() => {
    logFacetInteraction('sort', sortOrder)
  }, [sortOrder])

  useEffect(() => {
    if (publicError) {
      console.error(publicError)
      AnalyticsTracker.track('catalog_public_error', {
        message: String(publicError),
      })
    }
  }, [publicError])

  useEffect(() => {
    if (orgError) {
      console.error(orgError)
      AnalyticsTracker.track('catalog_org_error', {
        message: String(orgError),
      })
    }
  }, [orgError])

  useEffect(() => {
    const gotOrg = Array.isArray(orgData) && orgData.length > 0
    const data = gotOrg ? orgData : publicData
    const next = gotOrg ? orgNext : publicNext
    const fetching = gotOrg ? orgFetching : publicFetching
    if (fetching) return

    if (!data) return
    if (cursor && cursor === lastCursor.current) return

    setProducts(prev => (cursor ? [...prev, ...data] : data))
    setNextCursor(next ?? null)
    lastCursor.current = cursor
  }, [
    orgData,
    publicData,
    orgNext,
    publicNext,
    orgFetching,
    publicFetching,
    cursor,
  ])

  useEffect(() => {
    if (
      (orgQuery.isFetched || publicQuery.isFetched) &&
      products.length === 0 &&
      debouncedSearch
    ) {
      logZeroResults(debouncedSearch, {
        ...filters,
        onlyWithPrice,
        inStock,
        mySuppliers,
        onSpecial,
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
    inStock,
    mySuppliers,
    onSpecial,
    sortOrder,
  ])

  const gotOrg = Array.isArray(orgData) && orgData.length > 0
  const gotPublic = Array.isArray(publicData) && publicData.length > 0

  const isLoading = gotOrg ? orgQuery.isFetching : publicQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  const loadMore = useCallback(() => {
    if (nextCursor && nextCursor !== cursor && !loadingMore) setCursor(nextCursor)
  }, [nextCursor, cursor, loadingMore])

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
          av = (a.suppliers?.[0] || '').toLowerCase()
          bv = (b.suppliers?.[0] || '').toLowerCase()
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

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !nextCursor) return
    const observer = new IntersectionObserver(entries => {
      const [entry] = entries
      if (entry.isIntersecting) {
        loadMore()
      }
    })
    observer.observe(sentinel)
    return () => {
      observer.disconnect()
    }
  }, [nextCursor, loadMore])

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

  const handleAdd = (product: any) => {
    const item: Omit<CartItem, 'quantity'> = {
      id: product.catalog_id,
      supplierId: product.suppliers?.[0] || '',
      supplierName: product.suppliers?.[0] || '',
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

  const total =
    gotOrg && typeof orgTotal === 'number'
      ? orgTotal
      : gotPublic && typeof publicTotal === 'number'
        ? publicTotal
        : null

  return (
    <FullWidthLayout>
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && <LayoutDebugger show />}

      <FiltersBar
        filters={filters}
        setFilters={setFilters}
        onlyWithPrice={onlyWithPrice}
        setOnlyWithPrice={setOnlyWithPrice}
        inStock={inStock}
        setInStock={setInStock}
        mySuppliers={mySuppliers}
        setMySuppliers={setMySuppliers}
        onSpecial={onSpecial}
        setOnSpecial={setOnSpecial}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        view={view}
        setView={setView}
        publicError={publicError}
        orgError={orgError}
        showMoreFilters={showMoreFilters}
        setShowMoreFilters={setShowMoreFilters}
        bulkMode={bulkMode}
        setBulkMode={setBulkMode}
      />

      <div className="mt-6 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {view === 'list' ? (
          <>
              {hideConnectPill && !bannerDismissed && (
                <Alert className="mb-4">
                  <AlertDescription className="flex items-center justify-between">
                    Connect suppliers to unlock prices.
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => setBannerDismissed(true)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </AlertDescription>
                </Alert>
              )}
              {bulkMode && (
                <div className="sticky top-[var(--filters-h)] z-20 flex items-center justify-between border-b bg-background px-4 py-2 text-sm">
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
                filters={filters}
                onFilterChange={handleFilterChange}
                isBulkMode={bulkMode}
              />
          </>
        ) : (
          <div
            ref={gridRef}
            className="grid justify-center justify-items-center gap-6"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(260px,1fr))` }}
          >
            {sortedProducts.map(product => (
              <ProductCard
                key={product.catalog_id}
                product={product}
                showPrice
                onAdd={() => handleAdd(product)}
                isAdding={addingId === product.catalog_id}
              />
            ))}
            {loadingMore &&
              Array.from({ length: 3 }).map((_, i) => (
                <ProductCardSkeleton key={`skeleton-${i}`} />
              ))}
          </div>
        )}
      </div>
      <div ref={sentinelRef} />
    </FullWidthLayout>
  )
}

interface FiltersBarProps {
  filters: FacetFilters
  setFilters: (f: Partial<FacetFilters>) => void
  onlyWithPrice: boolean
  setOnlyWithPrice: (v: boolean) => void
  inStock: boolean
  setInStock: (v: boolean) => void
  mySuppliers: boolean
  setMySuppliers: (v: boolean) => void
  onSpecial: boolean
  setOnSpecial: (v: boolean) => void
  sortOrder: SortOrder
  setSortOrder: (v: SortOrder) => void
  view: 'grid' | 'list'
  setView: (v: 'grid' | 'list') => void
  publicError: unknown
  orgError: unknown
  showMoreFilters: boolean
  setShowMoreFilters: (v: boolean) => void
  bulkMode: boolean
  setBulkMode: (v: boolean) => void
}

function FiltersBar({
  filters,
  setFilters,
  onlyWithPrice,
  setOnlyWithPrice,
  inStock,
  setInStock,
  mySuppliers,
  setMySuppliers,
  onSpecial,
  setOnSpecial,
  sortOrder,
  setSortOrder,
  view,
  setView,
  publicError,
  orgError,
  showMoreFilters,
  setShowMoreFilters,
  bulkMode,
  setBulkMode,
}: FiltersBarProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const h = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--filters-h', `${h}px`)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { search: _search, ...facetFilters } = filters
  const hasFacetFilters = Object.values(facetFilters).some(Boolean)

  return (
    <div
      ref={ref}
      className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="py-3 space-y-3">
        {(publicError || orgError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {String(publicError || orgError)}
            </AlertDescription>
          </Alert>
        )}
        <Collapsible open={showMoreFilters} onOpenChange={setShowMoreFilters}>
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-3 items-center">
              <HeroSearchInput
                placeholder="Search products"
                value={filters.search ?? ''}
                onChange={e => setFilters({ search: e.target.value })}
              rightSlot={
                <button
                  type="button"
                  aria-label="Voice search"
                  onClick={() => console.log('voice search')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Mic className="h-5 w-5" />
                </button>
              }
            />
              <SortDropdown value={sortOrder} onChange={setSortOrder} />
              <ViewToggle value={view} onChange={setView} />
              <Button
                variant="outline"
                onClick={() => setBulkMode(!bulkMode)}
              >
                {bulkMode ? 'Cancel' : 'Select'}
              </Button>
            </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Disable pricing filter until pricing data is available */}
            {/* <FilterChip selected={onlyWithPrice} onSelectedChange={setOnlyWithPrice}>
               Only with price
             </FilterChip> */}
            <FilterChip selected={inStock} onSelectedChange={setInStock}>
              In stock
            </FilterChip>
            <FilterChip selected={mySuppliers} onSelectedChange={setMySuppliers}>
              My suppliers
            </FilterChip>
            <FilterChip selected={onSpecial} onSelectedChange={setOnSpecial}>
              On special
            </FilterChip>
            <CollapsibleTrigger asChild>
              <FilterChip selected={showMoreFilters}>More filters</FilterChip>
            </CollapsibleTrigger>
          </div>
          {hasFacetFilters && (
            <div className="mt-3">
              <ActiveFilterChips
                filters={facetFilters}
                onClear={key => setFilters({ [key]: undefined })}
              />
            </div>
          )}
          <CollapsibleContent className="mt-3">
            <CatalogFiltersPanel filters={filters} onChange={setFilters} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
