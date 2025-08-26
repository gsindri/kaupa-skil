import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { LayoutGrid, Table as TableIcon } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import {
  logSearch,
  logFilter,
  logFacetInteraction,
  logZeroResults,
} from '@/lib/analytics'

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
  const [selected, setSelected] = useState<string[]>([])

  const publicQuery = useCatalogProducts({ search, brand, cursor })
  const orgQuery = useOrgCatalog(orgId, { search, brand, onlyWithPrice, cursor })

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
    const data = orgQuery.data?.length ? orgQuery.data : publicQuery.data
    const next = orgQuery.data?.length ? orgQuery.nextCursor : publicQuery.nextCursor
    if (data) {
      setProducts(prev => (cursor ? [...prev, ...data] : data))
      setNextCursor(next ?? null)
    }
  }, [publicQuery.data, orgQuery.data, cursor, publicQuery.nextCursor, orgQuery.nextCursor])

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

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          placeholder="Search products"
          className="max-w-xs"
          value={search}
          onChange={e => {
            setCursor(null)
            setSearch(e.target.value)
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
            <CatalogGrid
              products={products}
              selected={selected}
              onSelect={toggleSelect}
              showPrice={!!orgId}
            />
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

