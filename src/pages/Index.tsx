import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useVendors } from '@/hooks/useVendors'
import { useCategories } from '@/hooks/useCategories'
import { SupplierFilter } from '@/components/place-order/SupplierFilter'
import { CatalogFilters } from '@/components/place-order/CatalogFilters'
import { SortControl } from '@/components/place-order/SortControl'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { ProductCard } from '@/components/place-order/ProductCard'
import { useOrgOffers } from '@/hooks/useOrgOffers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuickOrder() {
  const { vendors } = useVendors()
  const { data: categories = [] } = useCategories()
  const [searchParams, setSearchParams] = useSearchParams()

  const supplier = searchParams.get('supplier') ?? ''
  const sort = searchParams.get('sort') ?? 'name'
  const view = (searchParams.get('view') as 'grid' | 'list') || 'grid'
  const category = searchParams.get('category') ?? ''
  const brand = searchParams.get('brand') ?? ''
  const hasPrice = searchParams.get('price') === '1'

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

  const { data: queryProducts = [], isLoading } = useOrgOffers('', {
    supplier,
    category,
    brand,
    hasPrice
  })

  const products = [...queryProducts].sort((a, b) => a.name.localeCompare(b.name))

  if (vendors.length === 0 || (!isLoading && products.length === 0)) {
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
          brand={brand}
          categories={categories.map(c => c.name)}
          hasPrice={hasPrice}
          onCategoryChange={(v) => updateParam('category', v)}
          onBrandChange={(v) => updateParam('brand', v)}
          onHasPriceChange={(v) => updateParam('price', v)}
        />
        <SortControl value={sort} onChange={(v) => updateParam('sort', v)} />
        <ViewToggle value={view} onChange={(v) => updateParam('view', v)} />
      </div>

      {view === 'grid' ? (
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
