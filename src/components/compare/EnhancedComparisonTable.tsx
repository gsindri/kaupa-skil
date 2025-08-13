
import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import PriceBadge from '@/components/ui/PriceBadge'
import { Sparkline } from '@/components/ui/Sparkline'
import { Plus, Minus, Info, RotateCcw } from 'lucide-react'
import { useSettings } from '@/contexts/SettingsProvider'
import { useCart } from '@/contexts/CartProvider'

interface SupplierItem {
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
  priceHistory: number[]
}

interface ComparisonItem {
  id: string
  itemName: string
  brand: string
  category: string
  suppliers: SupplierItem[]
}

interface EnhancedComparisonTableProps {
  data: ComparisonItem[]
  isLoading: boolean
}

export function EnhancedComparisonTable({ data, isLoading }: EnhancedComparisonTableProps) {
  const { includeVat } = useSettings()
  const { addItem, items: cartItems, updateQuantity } = useCart()
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getQuantity = (supplierId: string, itemId: string) => {
    const key = `${supplierId}-${itemId}`
    return quantities[key] || 0
  }

  const updateLocalQuantity = (supplierId: string, itemId: string, newQuantity: number) => {
    const key = `${supplierId}-${itemId}`
    setQuantities(prev => ({
      ...prev,
      [key]: Math.max(0, newQuantity)
    }))
  }

  const handleAddToCart = (supplier: SupplierItem, item: ComparisonItem) => {
    const quantity = getQuantity(supplier.id, item.id) || 1
    
    addItem({
      id: `${supplier.id}-${item.id}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      itemName: item.itemName,
      sku: supplier.sku,
      packSize: supplier.packSize,
      packPrice: supplier.packPrice,
      unitPriceExVat: supplier.unitPriceExVat,
      unitPriceIncVat: supplier.unitPriceIncVat,
      vatRate: 0.24, // Default VAT rate for Iceland
      unit: supplier.unit
    }, quantity)

    // Reset local quantity
    updateLocalQuantity(supplier.id, item.id, 0)
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
    <Card className="card-elevated">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="text-left p-4 font-medium sticky left-0 bg-muted/50 z-20 min-w-[200px]">Product</th>
                <th className="text-left p-4 font-medium min-w-[120px]">Supplier</th>
                <th className="text-left p-4 font-medium min-w-[100px]">Pack</th>
                <th className="text-right p-4 font-medium min-w-[120px]">Price/Pack</th>
                <th className="text-right p-4 font-medium min-w-[140px]">
                  Price/Unit ({includeVat ? 'inc VAT' : 'ex VAT'})
                </th>
                <th className="text-left p-4 font-medium min-w-[80px]">Stock</th>
                <th className="text-left p-4 font-medium min-w-[100px]">History</th>
                <th className="text-left p-4 font-medium min-w-[120px]">Add</th>
                <th className="text-left p-4 font-medium min-w-[60px]">Info</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                item.suppliers.map((supplier, supplierIndex) => (
                  <tr key={`${item.id}-${supplier.id}`} className="border-b border-border hover:bg-muted/25">
                    {supplierIndex === 0 && (
                      <td rowSpan={item.suppliers.length} className="p-4 border-r border-border sticky left-0 bg-background z-10">
                        <div>
                          <div className="font-medium text-foreground">{item.itemName}</div>
                          <div className="text-sm text-muted-foreground">{item.brand}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </div>
                      </td>
                    )}
                    <td className="p-4">
                      <div className="font-medium text-foreground">{supplier.name}</div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {supplier.sku}
                      </code>
                      <div className="text-xs text-muted-foreground mt-1">
                        {supplier.packSize}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium font-mono">
                        {formatPrice(supplier.packPrice)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-medium font-mono">
                          {formatPrice(includeVat ? supplier.unitPriceIncVat : supplier.unitPriceExVat)}
                        </span>
                        <span className="text-xs text-muted-foreground">/{supplier.unit}</span>
                      </div>
                      {supplier.badge && (
                        <div className="mt-1">
                          <PriceBadge type={supplier.badge}>
                            {supplier.badge === 'best' ? 'Best ISK/' + supplier.unit : ''}
                          </PriceBadge>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={supplier.inStock ? 'default' : 'destructive'}>
                        {supplier.inStock ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Sparkline data={supplier.priceHistory} className="mb-1" />
                      <div className="text-xs text-muted-foreground">{supplier.lastUpdated}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateLocalQuantity(supplier.id, item.id, getQuantity(supplier.id, item.id) - 1)}
                          disabled={getQuantity(supplier.id, item.id) <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={getQuantity(supplier.id, item.id)}
                          onChange={(e) => updateLocalQuantity(supplier.id, item.id, parseInt(e.target.value) || 0)}
                          className="w-12 text-center h-8"
                          min="0"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateLocalQuantity(supplier.id, item.id, getQuantity(supplier.id, item.id) + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          disabled={!supplier.inStock || getQuantity(supplier.id, item.id) === 0}
                          onClick={() => handleAddToCart(supplier, item)}
                        >
                          Add
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <Button size="sm" variant="ghost">
                        <Info className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
