import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import type { FacetFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'

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
  const [search, setSearch] = useState('')
  const brand = filters.brand
  const debouncedSearch = useDebounce(search, 300)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const publicQuery = useCatalogProducts({
    search: debouncedSearch,
    brand,
    cursor,
  })
  const orgQuery = useOrgCatalog(orgId, {
    search: debouncedSearch,
    brand,
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

  // Merge products when either query updates
  useEffect(() => {
    const newProducts = [...(orgData || []), ...(publicData || [])]
    setProducts(prev => {
      if (cursor && cursor === lastCursor.current) {
        return [...prev, ...newProducts]
      }
      lastCursor.current = cursor
      return newProducts
    })
    setNextCursor(orgNext || publicNext || null)
  }, [publicData, orgData, orgNext, publicNext, cursor])

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

  const sortedProducts = products

  const isLoading = publicQuery.isFetching || orgQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) setCursor(nextCursor)
  }, [nextCursor, loadingMore])

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

  return (
    <div className="w-full min-w-0 overflow-visible">
      {/* Control bar */}
      <div className="pb-4 space-y-4">
        {(publicError || orgError) && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{String(publicError || orgError)}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search products"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 w-48"
          />
          <Input
            placeholder="Brand"
            value={filters.brand ?? ''}
            onChange={e =>
              setFilters(f => ({ ...f, brand: e.target.value || undefined }))
            }
            className="h-10 w-36"
          />
          <div className="ml-auto">
            <ViewToggle value={view} onChange={setView} />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="w-full min-w-0">
        {view === 'list' ? (
          <CatalogTable
            products={sortedProducts}
            selected={selected}
            onSelect={toggleSelect}
            onSelectAll={handleSelectAll}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {sortedProducts.map(p => (
              <div key={p.catalog_id} className="rounded border p-2">
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load more button */}
      {nextCursor && (
        <div ref={sentinelRef} className="flex justify-center pt-4">
          <Button onClick={loadMore} disabled={loadingMore} variant="outline">
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}

