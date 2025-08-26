import { Fragment, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { ProductCard } from '@/components/catalog/ProductCard'
import { useQueryClient } from '@tanstack/react-query'
import { fetchPublicCatalogItems } from '@/services/catalog'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [page, setPage] = useState(1)
  const [products, setProducts] = useState<any[]>([])
  const AUTO_LOAD_KEY = 'catalog-auto-load'
  const [autoLoad, setAutoLoad] = useState(() => {
    const saved = localStorage.getItem(AUTO_LOAD_KEY)
    return saved ? JSON.parse(saved) : false
  })
  const handleAutoLoadChange = (value: boolean) => {
    setAutoLoad(value)
    localStorage.setItem(AUTO_LOAD_KEY, JSON.stringify(value))
  }
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const queryClient = useQueryClient()

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
  const sentinelIndex = Math.floor(displayedProducts.length * 0.7)

  useEffect(() => {
    if (!autoLoad) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setPage(p => p + 1)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [autoLoad, displayedProducts.length])

  useEffect(() => {
    if (!autoLoad) return
    if (publicQuery.data?.length === 50) {
      queryClient.prefetchQuery({
        queryKey: ['catalog', { search, brand, page: page + 1 }],
        queryFn: () => fetchPublicCatalogItems({ search, brand, page: page + 1 }),
      })
    }
  }, [autoLoad, publicQuery.data, search, brand, page, queryClient])

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
        <div className="flex items-center space-x-2">
          <Switch id="auto-load" checked={autoLoad} onCheckedChange={handleAutoLoadChange} />
          <Label htmlFor="auto-load">Auto load</Label>
        </div>
        {orgId && (
          <div className="flex items-center space-x-2">
            <Switch id="with-price" checked={onlyWithPrice} onCheckedChange={setOnlyWithPrice} />
            <Label htmlFor="with-price">Has price</Label>
          </div>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayedProducts.map((p: any, idx: number) => (
          <Fragment key={p.catalog_id}>
            <ProductCard product={p} showPrice={!!orgId} />
            {autoLoad &&
              !orgQuery.data?.length &&
              publicQuery.data?.length === 50 &&
              idx === sentinelIndex && <div ref={sentinelRef} />}
          </Fragment>
        ))}
      </div>
      {!orgQuery.data?.length && publicQuery.data?.length === 50 && !autoLoad && (
        <div className="flex justify-center">
          <Button onClick={() => setPage(p => p + 1)}>Load more</Button>
        </div>
      )}
    </div>
  )
}
