import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { ProductCard } from '@/components/catalog/ProductCard'
import { VirtualizedGrid } from '@/components/catalog/VirtualizedGrid'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<any[]>([])
  const PAGE_SIZE = 50

  const orgQuery = useOrgCatalog(orgId, { search, brand, onlyWithPrice })
  const publicQuery = useCatalogProducts({ search, brand, page })
  console.log('CatalogPage orgQuery', orgQuery.data, orgQuery.error)
  console.log('CatalogPage useCatalogProducts', publicQuery.data)

  useEffect(() => {
    setPage(1)
    setProducts([])
  }, [search, brand])

  useEffect(() => {
    if (!orgQuery.data?.length && publicQuery.data)
      setProducts(prev => [...prev, ...publicQuery.data])
  }, [publicQuery.data, orgQuery.data])

  const displayedProducts = orgQuery.data?.length ? orgQuery.data : products

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
        {orgId && (
          <div className="flex items-center space-x-2">
            <Switch id="with-price" checked={onlyWithPrice} onCheckedChange={setOnlyWithPrice} />
            <Label htmlFor="with-price">Has price</Label>
          </div>
        )}
      </div>
      <VirtualizedGrid
        items={displayedProducts}
        loadMore={() => setPage(p => p + 1)}
        hasMore={!orgQuery.data?.length && publicQuery.data?.length === PAGE_SIZE}
        isLoading={publicQuery.isFetching}
        renderItem={(p: any) => (
          <ProductCard key={p.catalog_id} product={p} showPrice={!!orgId} />
        )}
      />
    </div>
  )
}
