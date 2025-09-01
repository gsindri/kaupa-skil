import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { SkeletonCard } from '@/components/catalog/SkeletonCard'
import FacetPanel from '@/components/catalog/FacetPanel'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import type { FacetFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { LayoutDebugger } from '@/components/debug/LayoutDebugger'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''

  const [filters, setFilters] = useState<FacetFilters>({})
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const lastCursor = useRef<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [search, setSearch] = useState('')
  const [facetOpen, setFacetOpen] = useState(false)
  const brand = filters.brand
  const debouncedSearch = useDebounce(search, 300)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const updateFilters = (f: Partial<FacetFilters>) => {
    setFilters(prev => ({ ...prev, ...f }))
    setCursor(null)
    lastCursor.current = null
    setProducts([])
  }

  const publicQuery = useCatalogProducts({
    search: debouncedSearch,
    brand,
    category: filters.category,
    supplier: filters.supplier,
    availability: filters.availability,
    packSizeRange: filters.packSizeRange,
    cursor,
  })
  const orgQuery = useOrgCatalog(orgId, {
    search: debouncedSearch,
    brand,
    category: filters.category,
    supplier: filters.supplier,
    availability: filters.availability,
    packSizeRange: filters.packSizeRange,
    onlyWithPrice,
    cursor,
  })

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
    logFilter({ ...filters, onlyWithPrice })
  }, [filters, onlyWithPrice])

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
    const hasOrgData = !!orgData?.length
    const data = hasOrgData ? orgData : publicData
    const next = hasOrgData ? orgNext : publicNext
    const fetching = hasOrgData ? orgFetching : publicFetching
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
      logZeroResults(debouncedSearch, { ...filters, onlyWithPrice })
    }
  }, [
    orgQuery.isFetched,
    publicQuery.isFetched,
    products.length,
    debouncedSearch,
    filters,
    onlyWithPrice,
  ])

  const isLoading = publicQuery.isFetching || orgQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) setCursor(nextCursor)
  }, [nextCursor, loadingMore])

  const sortedProducts = products

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

  const total =
    orgQuery.isFetched && typeof orgTotal === 'number'
      ? orgTotal
      : publicQuery.isFetched && typeof publicTotal === 'number'
        ? publicTotal
        : null

  function FiltersBar() {
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
        className="sticky top-[var(--header-h)] z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search products"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[150px]"
            />
            <Input
              placeholder="Brand"
              value={filters.brand ?? ''}
              onChange={e =>
                updateFilters({ brand: e.target.value || undefined })
              }
              className="w-full sm:w-40 md:w-48"
            />
            <Sheet open={facetOpen} onOpenChange={setFacetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="md:hidden">
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 sm:w-96">
                <FacetPanel filters={filters} onChange={updateFilters} />
              </SheetContent>
            </Sheet>
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && <LayoutDebugger show />}

      <FiltersBar />

      <div className="flex gap-6">
        <aside className="hidden md:block w-64 flex-shrink-0">
          <FacetPanel filters={filters} onChange={updateFilters} />
        </aside>
        <div className="flex-1">
          {view === 'list' ? (
            <CatalogTable
              products={sortedProducts}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <div className="grid gap-[clamp(16px,2vw,28px)] [grid-template-columns:repeat(auto-fit,minmax(18.5rem,1fr))]">
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
        </div>
      </div>
    </>
  )
}
