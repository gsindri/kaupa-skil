import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { ProductCard } from '@/components/catalog/ProductCard'
import {
  logSearch,
  logFilter,
  logZeroResults,
  logFacetInteraction,
  getDefaultFilters,
  getPopularFacets
} from '@/lib/analytics'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''
  const defaults = getDefaultFilters()
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState(defaults.brand || '')
  const [onlyWithPrice, setOnlyWithPrice] = useState(defaults.onlyWithPrice || false)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<any[]>([])
  const [popularFacets] = useState(getPopularFacets())
  const popularBrands = popularFacets.filter(f => f.facet === 'brand')

  const orgQuery = useOrgCatalog(orgId, { search, brand, onlyWithPrice })
  const publicQuery = useCatalogProducts({ search, brand, page })
  console.log('CatalogPage orgQuery', orgQuery.data, orgQuery.error)
  console.log('CatalogPage useCatalogProducts', publicQuery.data)

  useEffect(() => {
    setPage(1)
    setProducts([])
  }, [search, brand])

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
    if (!orgQuery.data?.length && publicQuery.data)
      setProducts(prev => [...prev, ...publicQuery.data])
  }, [publicQuery.data, orgQuery.data])

  const displayedProducts = orgQuery.data?.length ? orgQuery.data : products

  useEffect(() => {
    if (
      (orgQuery.isFetched || publicQuery.isFetched) &&
      displayedProducts.length === 0
    ) {
      logZeroResults(search, { brand, onlyWithPrice })
    }
  }, [displayedProducts, orgQuery.isFetched, publicQuery.isFetched, search, brand, onlyWithPrice])

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          placeholder="Search products"
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
        {popularBrands.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {popularBrands.map(b => (
              <Button
                key={b.value}
                variant="secondary"
                onClick={() => setBrand(b.value)}
              >
                {b.value}
              </Button>
            ))}
          </div>
        )}
        {orgId && (
          <div className="flex items-center space-x-2">
            <Switch id="with-price" checked={onlyWithPrice} onCheckedChange={setOnlyWithPrice} />
            <Label htmlFor="with-price">Has price</Label>
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedProducts.map((p: any) => (
          <ProductCard key={p.catalog_id} product={p} showPrice={!!orgId} />
        ))}
      </div>
      {!orgQuery.data?.length && publicQuery.data?.length === 50 && (
        <div className="flex justify-center">
          <Button onClick={() => setPage(p => p + 1)}>Load more</Button>
        </div>
      )}
    </div>
  )
}
