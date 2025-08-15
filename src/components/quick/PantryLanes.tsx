
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, History, BookOpen } from 'lucide-react'
import { ItemCard } from './ItemCard'

interface PantryLanesProps {
  userMode: 'just-order' | 'balanced' | 'analytical'
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

export function PantryLanes({ userMode }: PantryLanesProps) {
  const handleCompareItem = (itemId: string) => {
    console.log('Compare item:', itemId)
    // TODO: Implement compare functionality
  }

  return (
    <div className="space-y-6">
      {/* Favorites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-500" />
            <span>Favorites</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockFavorites.length > 0 ? (
            <div className="space-y-3">
              {mockFavorites.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  userMode={userMode}
                  onCompareItem={handleCompareItem}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Pin items to Favorites for quick access.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Order */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5 text-blue-500" />
            <span>Last Order</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockLastOrder.length > 0 ? (
            <div className="space-y-3">
              {mockLastOrder.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  userMode={userMode}
                  onCompareItem={handleCompareItem}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Your most recent order will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Guides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-green-500" />
            <span>Order Guides</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Create order guides to streamline regular purchases.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
