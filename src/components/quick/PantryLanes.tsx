
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, History, BookOpen } from 'lucide-react'
import { ItemCard } from './ItemCard'

interface PantryLanesProps {
  onLaneSelect: (lane: string | null) => void;
  selectedLane: string | null;
  onAddToCart: (itemId: string) => void;
}

// Mock data - replace with actual data from hooks
const mockFavorites = [
  {
    id: 'fav-1',
    name: 'Premium Organic Milk',
    brand: 'MS Dairies',
    packSize: '12×1L',
    unitPriceExVat: 180,
    unitPriceIncVat: 223,
    packPriceExVat: 2160,
    packPriceIncVat: 2676,
    unit: 'L',
    suppliers: ['costco', 'metro'],
    stock: true
  }
]

const mockLastOrder = [
  {
    id: 'last-1',
    name: 'Artisan Bread',
    brand: 'Reykjavik Bakehouse',
    packSize: '8×500g',
    unitPriceExVat: 320,
    unitPriceIncVat: 397,
    packPriceExVat: 2560,
    packPriceIncVat: 3176,
    unit: 'loaf',
    suppliers: ['bakehouse'],
    stock: true,
    lastQuantity: 2
  }
]

export function PantryLanes({ onLaneSelect, selectedLane, onAddToCart }: PantryLanesProps) {
  const handleCompareItem = (itemId: string) => {
    console.log('Compare item:', itemId)
    // TODO: Implement compare functionality
  }

  return (
    <div className="space-y-8">
      {/* Favorites */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Favorites</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {mockFavorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockFavorites.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  userMode="balanced"
                  onCompareItem={handleCompareItem}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
              <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">Pin items to Favorites for quick access.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Order */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <History className="h-5 w-5 text-blue-500" />
            <span>Last Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {mockLastOrder.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockLastOrder.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  userMode="balanced"
                  onCompareItem={handleCompareItem}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
              <History className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">Your most recent order will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Guides */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg">
            <BookOpen className="h-5 w-5 text-green-500" />
            <span>Order Guides</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-xl">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Create order guides to streamline regular purchases.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
