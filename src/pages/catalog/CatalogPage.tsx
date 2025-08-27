import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Checkbox } from '@/components/ui/checkbox'
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

  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const lastCursor = useRef<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')

  const publicQuery = useCatalogProducts({ search, brand, cursor })
  const orgQuery = useOrgCatalog(orgId, { search, brand, onlyWithPrice, cursor })

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
    logFilter({ brand, onlyWithPrice })
  }, [brand, onlyWithPrice])

  useEffect(() => {
    if (search) logSearch(search)
  }, [search])

  useEffect(() => {
    if (brand) logFacetInteraction('brand', brand)
  }, [brand])

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
    if ((orgQuery.isFetched || publicQuery.isFetched) && products.length === 0) {
      logZeroResults(search, { brand, onlyWithPrice })
    }
  }, [
    orgQuery.isFetched,
    publicQuery.isFetched,
    products.length,
    search,
    brand,
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
    <div className="w-full px-4">
      {(publicError || orgError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{String(publicError || orgError)}</AlertDescription>
        </Alert>
      )}

      <div className="sticky top-0 z-10 bg-background flex flex-wrap items-end gap-2 py-4">
        <ViewToggle value={view} onChange={setView} />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Brand"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          className="max-w-xs"
        />
        {orgId && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="only-with-price"
              checked={onlyWithPrice}
              onCheckedChange={checked => setOnlyWithPrice(!!checked)}
            />
            <label htmlFor="only-with-price" className="text-sm">
              Only with price
            </label>
          </div>
        )}
        <Button
          variant="outline"
          onClick={() => {
            setSearch('')
            setBrand('')
            setOnlyWithPrice(false)
          }}
        >
          Clear Filters
        </Button>
        {total !== null && (
          <div className="ml-auto text-sm text-muted-foreground">
            {total} products
          </div>
        )}
      </div>
          <div className="flex h-[200px] items-center justify-center bg-muted/20">
            No products
          </div>
        )}
        {products.length > 0 &&
          (view === 'grid' ? (
            <div
              className="grid w-full gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}
            >
              {products.map(product => {
                const id = product.catalog_id
                const isSelected = selected.includes(id)
                return (
                  <div key={id} className="relative">
                    <ProductCard
                      product={product}
                      showPrice={!!orgId}
                      density={density}
                    />
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(id)}
                      className="absolute top-2 left-2"
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="w-full">
              <CatalogTable
                products={products}
                selected={selected}
                onSelect={toggleSelect}
                onSelectAll={handleSelectAll}
              />
            </div>
          ))}
        </div>
    </div>
  )
}

