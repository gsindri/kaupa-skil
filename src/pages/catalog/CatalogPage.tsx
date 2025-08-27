import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { useCatalogSearchSuggestions } from '@/hooks/useCatalogSearchSuggestions'
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
import { cn } from '@/lib/utils'

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
  const debouncedSearch = useDebounce(search, 300)
  const publicQuery = useCatalogProducts({ search: debouncedSearch, brand, cursor })
  const orgQuery = useOrgCatalog(orgId, {
    search: debouncedSearch,
    brand,
    onlyWithPrice,
    cursor,
  })
  const { data: suggestions = [] } = useCatalogSearchSuggestions(
    debouncedSearch,
    orgId,
  )
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(0)

  useEffect(() => {
    setActiveSuggestion(0)
  }, [suggestions])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((p) => (p + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion((p) => (p - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const value = suggestions[activeSuggestion]
      if (value) {
        setSearch(value)
        setShowSuggestions(false)
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

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
    if (debouncedSearch) logSearch(debouncedSearch)
  }, [debouncedSearch])

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
      logZeroResults(debouncedSearch, { brand, onlyWithPrice })
    }
  }, [
    orgQuery.isFetched,
    publicQuery.isFetched,
    products.length,
    debouncedSearch,
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

  return (
    <div className="space-y-4 p-4">
      {(publicError || orgError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{String(publicError || orgError)}</AlertDescription>
        </Alert>
      )}

      <ViewToggle value={view} onChange={setView} />

      <div className="flex flex-wrap items-end gap-2">
        <div className="relative max-w-xs">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => {
              if (search) setShowSuggestions(true)
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyDown={handleKeyDown}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-background text-sm shadow-md"
              role="listbox"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={i === activeSuggestion}
                  className={cn(
                    'cursor-pointer px-2 py-1',
                    i === activeSuggestion && 'bg-accent text-accent-foreground',
                  )}
                  onMouseEnter={() => setActiveSuggestion(i)}
                  onMouseDown={e => {
                    e.preventDefault()
                    setSearch(s)
                    setShowSuggestions(false)
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
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
      </div>

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

