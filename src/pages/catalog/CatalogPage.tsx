import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LayoutGrid, Table as TableIcon, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { Checkbox } from '@/components/ui/checkbox'
import {
  logSearch,
  logFilter,
  logFacetInteraction,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''

  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [view, setView] = useState<'grid' | 'table'>('grid')
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
    if (search) logSearch(search)
  }, [search])

  useEffect(() => {
    logFilter({ brand, onlyWithPrice })
  }, [brand, onlyWithPrice])

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
  }, [orgQuery.isFetched, publicQuery.isFetched, products.length, search, brand, onlyWithPrice])

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

  const clearFilters = () => {
    setSearch('')
    setBrand('')
    setOnlyWithPrice(false)
    setCursor(null)
  }

  const totalCount = orgData && orgData.length ? orgTotal : publicTotal

  return (
    <div className="space-y-4 p-4">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 space-y-2 bg-background p-4">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            placeholder="Search products"
            className="max-w-xs"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setCursor(null)
            }}
          />
          <Input
            placeholder="Brand"
            className="max-w-xs"
            value={brand}
            onChange={e => {
              setCursor(null)
              setBrand(e.target.value)
            }}
          />
          {orgId && (
            <div className="flex items-center space-x-2">
              <Switch id="with-price" checked={onlyWithPrice} onCheckedChange={val => {
                setCursor(null)
                setOnlyWithPrice(val)
              }} />
              <Label htmlFor="with-price">Has price</Label>
            </div>
          )}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={v => setView((v as 'grid' | 'table') || 'grid')}
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {view === 'grid' && (
            <ToggleGroup
              type="single"
              value={density}
              onValueChange={v =>
                setDensity((v as 'comfortable' | 'compact') || 'comfortable')
              }
            >
              <ToggleGroupItem value="comfortable" aria-label="Comfortable density">
                Comfort
              </ToggleGroupItem>
              <ToggleGroupItem value="compact" aria-label="Compact density">
                Compact
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {products.length} loaded
            {typeof totalCount === 'number' ? ` of ${totalCount}` : ''}
          </span>
          {(search || brand || onlyWithPrice) && (
            <Button variant="link" onClick={clearFilters} className="px-0">
              Clear filters
            </Button>
          )}
        </div>
      </div>
      {(publicError || orgError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{String(publicError || orgError)}</AlertDescription>
        </Alert>
      )}

      <div className="min-h-[200px]">
        {products.length === 0 && (publicQuery.isFetching || orgQuery.isFetching) && (
          <div className="flex h-[200px] items-center justify-center bg-muted/20">
            Loading products...
          </div>
        )}
        {products.length === 0 && !(publicQuery.isFetching || orgQuery.isFetching) && (
          <div className="flex h-[200px] items-center justify-center bg-muted/20">
            No products
          </div>
        )}
        {products.length > 0 &&
          (view === 'grid' ? (
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}
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
            <CatalogTable
              products={products}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
            />
          ))}
      </div>

      {nextCursor && (
        <Button onClick={loadMore} disabled={publicQuery.isFetching || orgQuery.isFetching}>
          Load more
        </Button>
      )}
    </div>
  )
}

