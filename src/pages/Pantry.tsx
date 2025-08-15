import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter, Grid, List } from 'lucide-react'
import { useCart } from '@/contexts/BasketProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { ItemCard } from '@/components/quick/ItemCard'
import type { CartItem } from '@/lib/types'

interface PantryItem {
  id: string
  name: string
  brand: string
  packSize: string
  unitPriceExVat: number
  unitPriceIncVat: number
  packPriceExVat: number
  packPriceIncVat: number
  unit: string
  suppliers: string[]
  stock: boolean
  deliveryFee?: number
  cutoffTime?: string
  deliveryDay?: string
  isPremiumBrand?: boolean
  isDiscounted?: boolean
  originalPrice?: number
}

const mockPantryItems: PantryItem[] = [
  {
    id: 'milk-001',
    name: 'Organic Milk',
    brand: 'Acme Farms',
    packSize: '1L',
    unitPriceExVat: 180,
    unitPriceIncVat: 223,
    packPriceExVat: 180,
    packPriceIncVat: 223,
    unit: 'L',
    suppliers: ['Metro', 'Costco'],
    stock: true,
    deliveryFee: 2500,
    cutoffTime: '14:00',
    deliveryDay: 'Tomorrow',
    isPremiumBrand: true,
    isDiscounted: true,
    originalPrice: 250,
  },
  {
    id: 'bread-002',
    name: 'Whole Wheat Bread',
    brand: 'Sunrise Bakery',
    packSize: '500g',
    unitPriceExVat: 300,
    unitPriceIncVat: 372,
    packPriceExVat: 300,
    packPriceIncVat: 372,
    unit: 'loaf',
    suppliers: ['Metro', 'Bónus'],
    stock: true,
    deliveryFee: 1500,
    cutoffTime: '16:00',
    deliveryDay: 'Next Day',
  },
  {
    id: 'eggs-003',
    name: 'Free-Range Eggs',
    brand: 'Happy Hen Farms',
    packSize: 'Dozen',
    unitPriceExVat: 450,
    unitPriceIncVat: 558,
    packPriceExVat: 450,
    packPriceIncVat: 558,
    unit: 'dozen',
    suppliers: ['Costco', 'Krónan'],
    stock: false,
    deliveryFee: 3000,
    cutoffTime: '12:00',
    deliveryDay: 'In 2 Days',
  },
  {
    id: 'butter-004',
    name: 'Unsalted Butter',
    brand: 'Golden Dairy',
    packSize: '250g',
    unitPriceExVat: 320,
    unitPriceIncVat: 397,
    packPriceExVat: 320,
    packPriceIncVat: 397,
    unit: 'pack',
    suppliers: ['Bónus', 'Hagkaup'],
    stock: true,
    isPremiumBrand: true,
  },
  {
    id: 'cheese-005',
    name: 'Cheddar Cheese',
    brand: 'Valley Farms',
    packSize: '200g',
    unitPriceExVat: 400,
    unitPriceIncVat: 496,
    packPriceExVat: 400,
    packPriceIncVat: 496,
    unit: 'pack',
    suppliers: ['Krónan', 'Metro'],
    stock: true,
    deliveryFee: 2000,
    cutoffTime: '15:00',
    deliveryDay: 'Tomorrow',
  },
  {
    id: 'yogurt-006',
    name: 'Greek Yogurt',
    brand: 'Olympus Dairy',
    packSize: '1kg',
    unitPriceExVat: 600,
    unitPriceIncVat: 744,
    packPriceExVat: 600,
    packPriceIncVat: 744,
    unit: 'tub',
    suppliers: ['Hagkaup', 'Costco'],
    stock: true,
    isDiscounted: true,
    originalPrice: 700,
  },
  {
    id: 'pasta-007',
    name: 'Spaghetti Pasta',
    brand: 'Italian Harvest',
    packSize: '500g',
    unitPriceExVat: 250,
    unitPriceIncVat: 310,
    packPriceExVat: 250,
    packPriceIncVat: 310,
    unit: 'pack',
    suppliers: ['Metro', 'Bónus'],
    stock: true,
  },
  {
    id: 'rice-008',
    name: 'Basmati Rice',
    brand: 'Eastern Grains',
    packSize: '1kg',
    unitPriceExVat: 350,
    unitPriceIncVat: 434,
    packPriceExVat: 350,
    packPriceIncVat: 434,
    unit: 'pack',
    suppliers: ['Costco', 'Krónan'],
    stock: true,
    deliveryFee: 2800,
    cutoffTime: '13:00',
    deliveryDay: 'Next Day',
  },
  {
    id: 'cereal-009',
    name: 'Corn Flakes Cereal',
    brand: 'Morning Start',
    packSize: '750g',
    unitPriceExVat: 420,
    unitPriceIncVat: 521,
    packPriceExVat: 420,
    packPriceIncVat: 521,
    unit: 'box',
    suppliers: ['Bónus', 'Hagkaup'],
    stock: true,
    isPremiumBrand: true,
  },
  {
    id: 'coffee-010',
    name: 'Ground Coffee',
    brand: 'Dark Roast Co.',
    packSize: '500g',
    unitPriceExVat: 550,
    unitPriceIncVat: 682,
    packPriceExVat: 550,
    packPriceIncVat: 682,
    unit: 'pack',
    suppliers: ['Hagkaup', 'Metro'],
    stock: true,
    deliveryFee: 1800,
    cutoffTime: '17:00',
    deliveryDay: 'In 2 Days',
  },
]

export default function Pantry() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { includeVat } = useSettings()
  const { items: cartItems } = useCart()

  const filteredItems = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase()
    return mockPantryItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(lowerQuery) ||
        item.brand.toLowerCase().includes(lowerQuery)
      )
    })
  }, [searchQuery])

  const handleCompareItem = (itemId: string) => {
    alert(`Compare item with ID: ${itemId}`)
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-semibold">Pantry</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <QuickSearch value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="col-span-1 lg:col-span-1 flex items-center justify-end space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setViewMode('grid')}>
                <Grid className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode('list')}>
                <List className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="mt-6">
            {viewMode === 'grid' ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onCompareItem={handleCompareItem}
                    userMode="balanced"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onCompareItem={handleCompareItem}
                    userMode="balanced"
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
