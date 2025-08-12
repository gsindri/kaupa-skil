
import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import VatToggle from '@/components/ui/VatToggle'
import PriceBadge from '@/components/ui/PriceBadge'
import { Search, Filter, Download, Plus, ShoppingCart } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useUnitsVat } from '@/hooks/useUnitsVat'
import { useAuth } from '@/hooks/useAuth'

interface PriceComparisonItem {
  id: string
  itemName: string
  brand: string
  category: string
  suppliers: {
    id: string
    name: string
    sku: string
    packSize: string
    packPrice: number
    unitPriceExVat: number
    unitPriceIncVat: number
    unit: string
    inStock: boolean
    lastUpdated: string
    badge?: 'best' | 'good' | 'average' | 'expensive'
    vatCode: string
  }[]
}

export function PriceComparisonTableNew() {
  const [includeVat, setIncludeVat] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const { profile } = useAuth()
  const { data: unitsVatData } = useUnitsVat()

  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['price-comparison', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []

      // Get items with their supplier items and latest price quotes
      const { data, error } = await supabase
        .from('items')
        .select(`
          id,
          name,
          brand,
          categories!inner(name),
          supplier_items!inner(
            id,
            supplier_id,
            ext_sku,
            display_name,
            pack_qty,
            pack_unit_id,
            yield_pct,
            suppliers!inner(id, name),
            units!pack_unit_id(code, name),
            price_quotes!supplier_item_id(
              pack_price,
              unit_price_ex_vat,
              unit_price_inc_vat,
              vat_code,
              observed_at,
              currency
            )
          )
        `)
        .limit(50)

      if (error) throw error

      // Transform the data into comparison format
      const comparisonItems: PriceComparisonItem[] = []
      
      for (const item of data || []) {
        const supplierData: PriceComparisonItem['suppliers'] = []
        
        for (const supplierItem of item.supplier_items || []) {
          const latestPrice = supplierItem.price_quotes?.[0] // Assuming ordered by observed_at desc
          
          if (latestPrice && supplierItem.suppliers && supplierItem.units) {
            supplierData.push({
              id: supplierItem.suppliers.id,
              name: supplierItem.suppliers.name,
              sku: supplierItem.ext_sku,
              packSize: `${supplierItem.pack_qty} ${supplierItem.units.name}`,
              packPrice: latestPrice.pack_price,
              unitPriceExVat: latestPrice.unit_price_ex_vat || 0,
              unitPriceIncVat: latestPrice.unit_price_inc_vat || 0,
              unit: supplierItem.units.code,
              inStock: true, // TODO: implement stock tracking
              lastUpdated: new Date(latestPrice.observed_at).toLocaleDateString('is-IS'),
              vatCode: latestPrice.vat_code,
            })
          }
        }

        if (supplierData.length > 0) {
          // Calculate price badges
          const prices = supplierData.map(s => includeVat ? s.unitPriceIncVat : s.unitPriceExVat)
          const minPrice = Math.min(...prices)
          const maxPrice = Math.max(...prices)
          const priceRange = maxPrice - minPrice

          supplierData.forEach(supplier => {
            const price = includeVat ? supplier.unitPriceIncVat : supplier.unitPriceExVat
            const percentile = priceRange > 0 ? (price - minPrice) / priceRange : 0
            
            if (percentile <= 0.1) supplier.badge = 'best'
            else if (percentile <= 0.3) supplier.badge = 'good'
            else if (percentile <= 0.7) supplier.badge = 'average'
            else supplier.badge = 'expensive'
          })

          comparisonItems.push({
            id: item.id,
            itemName: item.name,
            brand: item.brand || '',
            category: item.categories?.name || '',
            suppliers: supplierData
          })
        }
      }

      return comparisonItems
    },
    enabled: !!profile?.tenant_id
  })

  const filteredData = useMemo(() => {
    if (!comparisonData) return []
    
    return comparisonData.filter(item => {
      const searchLower = searchTerm.toLowerCase()
      return (
        item.itemName.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.suppliers.some(s => 
          s.name.toLowerCase().includes(searchLower) || 
          s.sku.toLowerCase().includes(searchLower)
        )
      )
    })
  }, [comparisonData, searchTerm])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  const handleAddToCart = (supplierId: string, supplierItemId: string) => {
    // TODO: Implement cart functionality
    console.log('Adding to cart:', { supplierId, supplierItemId })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading price comparison data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="text-xl font-semibold">Price Comparison</CardTitle>
            <div className="flex items-center space-x-4">
              <VatToggle includeVat={includeVat} onToggle={setIncludeVat} />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brands, or SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="default">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="default">
              <ShoppingCart className="h-4 w-4 mr-2" />
              View Cart ({selectedItems.size})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Price Comparison Table */}
      <Card className="card-elevated">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-64">Product</th>
                  <th>Supplier</th>
                  <th>SKU</th>
                  <th>Pack Size</th>
                  <th className="text-right">Price per Pack</th>
                  <th className="text-right">
                    Price per Unit ({includeVat ? 'inc VAT' : 'ex VAT'})
                  </th>
                  <th>Stock</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => (
                  item.suppliers.map((supplier, supplierIndex) => (
                    <tr key={`${item.id}-${supplier.id}`} className="animate-fade-in">
                      {supplierIndex === 0 && (
                        <td rowSpan={item.suppliers.length} className="border-r border-table-border">
                          <div>
                            <div className="font-medium text-foreground">{item.itemName}</div>
                            <div className="text-sm text-muted-foreground">{item.brand}</div>
                            <div className="text-xs text-muted-foreground">{item.category}</div>
                          </div>
                        </td>
                      )}
                      <td>
                        <div className="font-medium text-foreground">{supplier.name}</div>
                      </td>
                      <td>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {supplier.sku}
                        </code>
                      </td>
                      <td>
                        <span className="text-sm text-foreground">{supplier.packSize}</span>
                      </td>
                      <td className="text-right">
                        <div className="font-medium currency-isk">
                          {formatPrice(supplier.packPrice)}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-medium currency-isk">
                            {formatPrice(includeVat ? supplier.unitPriceIncVat : supplier.unitPriceExVat)}
                          </span>
                          <span className="text-xs text-muted-foreground">/{supplier.unit}</span>
                        </div>
                      </td>
                      <td>
                        <Badge variant={supplier.inStock ? 'default' : 'destructive'}>
                          {supplier.inStock ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground">{supplier.lastUpdated}</span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          {supplier.badge && (
                            <PriceBadge type={supplier.badge}>
                              {supplier.badge === 'best' ? 'Best Price' :
                               supplier.badge === 'good' ? 'Good Deal' :
                               supplier.badge === 'average' ? 'Average' :
                               'Expensive'}
                            </PriceBadge>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleAddToCart(supplier.id, item.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
