import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useVendors } from '@/hooks/useVendors'
import { SupplierFilter } from '@/components/place-order/SupplierFilter'
import { CatalogFilters } from '@/components/place-order/CatalogFilters'
import { SortControl } from '@/components/place-order/SortControl'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { ProductCard, Product } from '@/components/place-order/ProductCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Temporary mock products to demonstrate catalog behaviour
const mockProducts: Product[] = [
  { id: 'p1', name: 'Íslenskt smjör', supplierId: '1', supplierName: 'Vefkaupmenn', pack: '1 kg', price: 1200 },
  { id: 'p2', name: 'Rúgbrauð', supplierId: '2', supplierName: 'Heilsuhúsið', pack: '1 stk', price: 500 },
  { id: 'p3', name: 'Harðfiskur', supplierId: '1', supplierName: 'Vefkaupmenn', pack: '500 g', price: 1500 }
]

export default function QuickOrder() {
  const { vendors } = useVendors()
  const [searchParams, setSearchParams] = useSearchParams()

  const supplier = searchParams.get('supplier') ?? ''
  const sort = searchParams.get('sort') ?? 'name'
  const view = (searchParams.get('view') as 'grid' | 'list') || 'grid'
  const category = searchParams.get('category') ?? ''
  const inStock = searchParams.get('stock') === '1'

  const updateParam = (key: string, value: string | boolean) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (typeof value === 'boolean') {
        if (value) p.set(key, '1')
        else p.delete(key)
      } else {
        if (value) p.set(key, value)
        else p.delete(key)
      }
      return p
    })
  }

  const filtered = mockProducts
    .filter(p => !supplier || p.supplierId === supplier)
    .filter(p => !category || p.pack.toLowerCase().includes(category.toLowerCase()))
    .filter(p => !inStock || true)

  const products = [...filtered].sort((a, b) => {
    switch (sort) {
      case 'price':
        return a.price - b.price
      case 'newest':
      case 'popular':
        return 0
      default:
        return a.name.localeCompare(b.name)
    }
  })

  if (vendors.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle>Connect a wholesaler to start ordering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Link your first supplier to see their catalog and start placing orders.</p>
            <Button className="w-full" onClick={() => alert('connect flow')}>Connect a wholesaler</Button>
            <div className="flex justify-center gap-4 text-sm">
              <Link to="/discovery" className="underline">Browse suppliers</Link>
              <a href="#" className="underline">Learn how it works</a>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SupplierFilter
          suppliers={vendors}
          value={supplier}
          onChange={(v) => updateParam('supplier', v)}
        />
        <CatalogFilters
          category={category}
          categories={['Bakery', 'Dairy', 'Seafood']}
          inStock={inStock}
          onCategoryChange={(v) => updateParam('category', v)}
          onInStockChange={(v) => updateParam('stock', v)}
        />
        <SortControl value={sort} onChange={(v) => updateParam('sort', v)} />
        <ViewToggle value={view} onChange={(v) => updateParam('view', v)} />
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="mb-4 text-muted-foreground">No items match your filters</p>
          <Button variant="outline" onClick={() => setSearchParams(new URLSearchParams())}>Clear filters</Button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
