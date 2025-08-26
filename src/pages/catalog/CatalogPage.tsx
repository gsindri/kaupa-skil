import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [onlyWithPrice, setOnlyWithPrice] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])

  const orgQuery = useOrgCatalog(orgId, { search, brand, onlyWithPrice, cursor })
  const publicQuery = useCatalogProducts({ search, brand, cursor })
  console.log('CatalogPage orgQuery', orgQuery.data, orgQuery.error)
  console.log('CatalogPage useCatalogProducts', publicQuery.data)

  useEffect(() => {
    setCursor(null)
    setProducts([])
  }, [search, brand])

  useEffect(() => {
    if (!orgQuery.data?.length && publicQuery.data)
      setProducts(prev => [...prev, ...publicQuery.data])
  }, [publicQuery.data, orgQuery.data])

  const displayedProducts = orgQuery.data?.length ? orgQuery.data : products

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
