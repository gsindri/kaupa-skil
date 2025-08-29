import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Checkbox } from '@/components/ui/checkbox'
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
  const brand = filters.brand
  const debouncedSearch = useDebounce(search, 300)

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

  const loadMore = () => {
    if (nextCursor) setCursor(nextCursor)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(products.map(p => p.catalog_id))
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

  const isLoading = publicQuery.isFetching || orgQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <LayoutDebugger show={true} />
      
      {/* Control bar */}
      <div className="pb-4 space-y-4 px-3 lg:px-4">
        {(publicError || orgError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{String(publicError || orgError)}</AlertDescription>
          </Alert>
        )}

        <div className="mb-4 lg:mb-6 grid gap-3 md:grid-cols-[1fr,320px,auto] items-center">
          <Input
            placeholder="Search products"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Input
            placeholder="Brand"
            value={filters.brand ?? ''}
            onChange={e => setFilters(prev => ({ ...prev, brand: e.target.value }))}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="price-toggle"
              checked={onlyWithPrice}
              onCheckedChange={checked => setOnlyWithPrice(Boolean(checked))}
            />
            <label htmlFor="price-toggle" className="text-sm">
              Only with price
            </label>
          </div>
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Content area */}
      <div className="w-full min-w-0">
        {view === 'list' ? (
          <div className="px-3 lg:px-4">
            <CatalogTable
              products={products}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
            />
          </div>
        ) : (
          <div className="px-3 lg:px-4">
            <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-[repeat(auto-fill,minmax(160px,_1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,_1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,_1fr))] xl:grid-cols-[repeat(auto-fill,minmax(210px,_1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(220px,_1fr))]">
              {products.map(p => (
                <ProductCard
                  key={p.catalog_id}
                  product={p}
                  density="compact"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Load more button */}
      {nextCursor && (
        <div className="flex justify-center pt-4 px-3 lg:px-4">
          <Button onClick={loadMore} disabled={loadingMore} variant="outline">
            {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
