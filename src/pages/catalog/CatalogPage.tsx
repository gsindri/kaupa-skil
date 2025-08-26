import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''
  console.log('CatalogPage orgQuery', orgQuery.data, orgQuery.error)
  console.log('CatalogPage useCatalogProducts', publicQuery.data)

  useEffect(() => {

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

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelected(displayedProducts.map((p: any) => p.catalog_id))
    else setSelected([])
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          placeholder="Search products"
          className="max-w-xs"
        />
        <Input
          placeholder="Brand"
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
        <ToggleGroup type="single" value={view} onValueChange={(v) => setView((v as 'grid' | 'table') || 'grid')}>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
