import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { SkeletonCard } from '@/components/catalog/SkeletonCard'
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

  const [inStock, setInStock] = useState(false)
  const [mySuppliers, setMySuppliers] = useState(false)
  const [onSpecial, setOnSpecial] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const lastCursor = useRef<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'brand' | 'supplier'
    direction: 'asc' | 'desc'
  } | null>(null)
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setCursor(null)
    setNextCursor(null)
    setProducts([])
    lastCursor.current = null
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [filters, sortOrder, onlyWithPrice, mySuppliers])

  useEffect(() => {
    if (sortOrder === 'az') {
      setTableSort({ key: 'name', direction: 'asc' })
    } else {
      setTableSort(null)
    }
  }, [sortOrder])

  const publicFilters: PublicCatalogFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch || undefined, cursor }),
    [filters, debouncedSearch, cursor],
  )
  const orgFilters: OrgCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      onlyWithPrice,
      cursor,
    }),
    [filters, debouncedSearch, onlyWithPrice, cursor],
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
    if (filters.supplier) logFacetInteraction('supplier', filters.supplier)
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
    const useOrg = mySuppliers
    const data = useOrg ? orgData : publicData
    const next = useOrg ? orgNext : publicNext
    const fetching = useOrg ? orgFetching : publicFetching
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
    mySuppliers,
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

  const isLoading = mySuppliers ? orgQuery.isFetching : publicQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) setCursor(nextCursor)
  }, [nextCursor, loadingMore])

  const sortedProducts = useMemo(() => {
    if (!tableSort) return products
    const sorted = [...products]
    sorted.sort((a, b) => {
      const getVal = (p: any) => {
        if (tableSort.key === 'supplier')
          return (p.suppliers?.[0] || '').toLowerCase()
        return (p[tableSort.key] || '').toLowerCase()
      }
      const av = getVal(a)
      const bv = getVal(b)
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

  const handleSort = (key: 'name' | 'brand' | 'supplier') => {
    setTableSort(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleFilterChange = (f: Partial<FacetFilters>) => {
    setFilters(f)
  }

  const total =
    orgQuery.isFetched && typeof orgTotal === 'number'
      ? orgTotal
      : publicQuery.isFetched && typeof publicTotal === 'number'
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
      />

      {view === 'list' ? (
        <CatalogTable
          products={sortedProducts}
          selected={selected}
          onSelect={toggleSelect}
          onSelectAll={handleSelectAll}
          sort={tableSort}
          onSort={handleSort}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      ) : (
        <div className="grid justify-center gap-[clamp(16px,2vw,28px)] [grid-template-columns:repeat(auto-fit,minmax(0,18.5rem))]">
          {sortedProducts.map(product => (
            <ProductCard
              key={product.catalog_id}
              product={product}
              density={density}
            />
          ))}
          {loadingMore &&
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} density={density} />
            ))}
        </div>
      )}
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
        <div className="grid grid-cols-[1fr,auto] gap-3 items-center">
          <Input
            placeholder="Search products"
            value={filters.search ?? ''}
            onChange={e => setFilters({ search: e.target.value })}
          />
          <ViewToggle value={view} onChange={setView} />
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Label className="flex items-center gap-2">
            <Switch
              checked={onlyWithPrice}
              onCheckedChange={setOnlyWithPrice}
            />
            Only with price
          </Label>
          <Label className="flex items-center gap-2">
            <Switch
              checked={inStock}
              onCheckedChange={checked => {
                setInStock(checked)
                setFilters({ availability: checked ? 'in_stock' : undefined })
              }}
            />
            In stock
          </Label>
          <Label className="flex items-center gap-2">
            <Switch checked={mySuppliers} onCheckedChange={setMySuppliers} />
            My suppliers
          </Label>
          <Label className="flex items-center gap-2">
            <Switch checked={onSpecial} onCheckedChange={setOnSpecial} />
            On special / promo
          </Label>
          <Select value={sortOrder} onValueChange={v => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="az">A–Z</SelectItem>
              <SelectItem value="recent">Recently ordered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
