
import React, { useState } from 'react'
import { Heart, Package, Plus, Minus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { toast } from '@/hooks/use-toast'

interface PantryItem {
  id: string
  name: string
  brand: string
  packSize: string
  unitPriceExVat: number
  unitPriceIncVat: number
  unit: string
  previousQuantity: number
  isFavorite: boolean
  supplierName: string
  supplierItemId: string
}

// Mock data for pantry items
const mockPantryItems: PantryItem[] = [
  {
    id: '1',
    name: 'Extra Virgin Olive Oil',
    brand: 'Bertolli',
    packSize: '500ml bottle',
    unitPriceExVat: 3780,
    unitPriceIncVat: 4688,
    unit: 'L',
    previousQuantity: 2,
    isFavorite: true,
    supplierName: 'Véfkaupmenn',
    supplierItemId: 'supplier-item-1'
  },
  {
    id: '2',
    name: 'Icelandic Skyr Plain',
    brand: 'KEA',
    packSize: '1kg container',
    unitPriceExVat: 850,
    unitPriceIncVat: 1054,
    unit: 'kg',
    previousQuantity: 5,
    isFavorite: true,
    supplierName: 'Heilsuhúsið',
    supplierItemId: 'supplier-item-3'
  }
]

export default function Pantry() {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const { addItem } = useCart()
  const { includeVat } = useSettings()

  const updateQuantity = (itemId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }))
  }

  const addToBasket = (item: PantryItem) => {
    const quantity = quantities[item.id] || item.previousQuantity
    if (quantity > 0) {
      addItem({
        id: item.id,
        supplierId: item.supplierName.toLowerCase().replace(/\s+/g, '-'),
        supplierName: item.supplierName,
        itemName: item.name,
        sku: `${item.brand}-${item.id}`,
        packSize: item.packSize,
        packPrice: includeVat ? item.unitPriceIncVat : item.unitPriceExVat,
        unitPriceExVat: item.unitPriceExVat,
        unitPriceIncVat: item.unitPriceIncVat,
        vatRate: 0.24,
        unit: item.unit,
        supplierItemId: item.supplierItemId,
        displayName: `${item.brand} ${item.name}`,
        packQty: 1
      }, quantity)
      
      toast({
        title: "Added to basket",
        description: `${quantity}x ${item.name} added to your basket`,
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const PantryItemCard = ({ item }: { item: PantryItem }) => {
    const currentQuantity = quantities[item.id] ?? item.previousQuantity
    const displayPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
    const vatLabel = includeVat ? 'inc VAT' : 'ex VAT'

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{item.brand}</p>
              <p className="text-xs text-muted-foreground">{item.supplierName}</p>
            </div>
            {item.isFavorite && (
              <Heart className="h-4 w-4 text-red-500 fill-current" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatPrice(displayPrice)}</span>
              <Badge variant="outline" className="text-xs">
                per {item.unit}, {vatLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Pack: {item.packSize}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.id, -1)}
                disabled={currentQuantity <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-medium">
                {currentQuantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateQuantity(item.id, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <Button
              onClick={() => addToBasket(item)}
              disabled={currentQuantity <= 0}
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Basket
            </Button>
          </div>

          {item.previousQuantity > 0 && (
            <p className="text-xs text-muted-foreground">
              Last ordered: {item.previousQuantity} units
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  const favorites = mockPantryItems.filter(item => item.isFavorite)
  const orderGuides = mockPantryItems // In a real app, this would be different

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pantry</h1>
        <p className="text-muted-foreground">
          Quick reorder your favorite items and order guides
        </p>
      </div>

      <Tabs defaultValue="favorites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="favorites" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>Favorites</span>
          </TabsTrigger>
          <TabsTrigger value="guides" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Order Guides</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="space-y-6">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map(item => (
                <PantryItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">
                Pin items from Compare to build your pantry
              </p>
              <Button asChild>
                <a href="/compare">Browse Products</a>
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          {orderGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orderGuides.map(item => (
                <PantryItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No order guides yet</h3>
              <p className="text-muted-foreground mb-4">
                Create order guides from your frequently ordered items
              </p>
              <Button asChild>
                <a href="/compare">Browse Products</a>
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
