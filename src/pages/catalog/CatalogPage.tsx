import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { ProductCard } from '@/components/catalog/ProductCard'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''
  const [searchParams, setSearchParams] = useSearchParams()
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [products, setProducts] = useState<any[]>([])

  const search = searchParams.get('q') ?? ''
  const brand = searchParams.get('cat') ?? ''
  const supplier = searchParams.get('supplier') ?? ''
  const sort = searchParams.get('sort') ?? ''
  const page = Number(searchParams.get('cursor') ?? '1')

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'cursor') params.set('cursor', '1')
    setSearchParams(params)
  }

  const orgQuery = useOrgCatalog(orgId, { search, brand, onlyWithPrice })
  const publicQuery = useCatalogProducts({ search, brand, page })
  console.log('CatalogPage orgQuery', orgQuery.data, orgQuery.error)
  console.log('CatalogPage useCatalogProducts', publicQuery.data)

  useEffect(() => {
    setProducts([])
  }, [search, brand, supplier, sort])

  useEffect(() => {
    if (!orgQuery.data?.length && publicQuery.data)
      setProducts(prev => (page === 1 ? publicQuery.data : [...prev, ...publicQuery.data]))
  }, [publicQuery.data, orgQuery.data, page])

  const queryKey = searchParams.toString()
  const restored = useRef(false)

  useEffect(() => {
    if (!restored.current) {
      const pos = sessionStorage.getItem(queryKey)
      if (pos) window.scrollTo(0, parseInt(pos, 10))
      restored.current = true
    }
  }, [queryKey])

  useEffect(() => {
    return () => {
      sessionStorage.setItem(queryKey, String(window.scrollY))
    }
  }, [queryKey])

  const displayedProducts = orgQuery.data?.length ? orgQuery.data : products

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          placeholder="Search products"
          value={search}
          onChange={e => setParam('q', e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Brand"
          value={brand}
          onChange={e => setParam('cat', e.target.value)}
          className="max-w-xs"
        />
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
          <Button onClick={() => setParam('cursor', String(page + 1))}>Load more</Button>
        </div>
      )}
    </div>
  )
}
