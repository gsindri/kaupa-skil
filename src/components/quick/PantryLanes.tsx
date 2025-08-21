
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, History, BookOpen } from 'lucide-react'
import { ItemCard } from './ItemCard'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

interface PantryLanesProps {
  onLaneSelect: (lane: string | null) => void;
  selectedLane: string | null;
  onAddToCart: (itemId: string) => void;
}

export function PantryLanes({ onLaneSelect, selectedLane, onAddToCart }: PantryLanesProps) {
  const { profile } = useAuth()

  const { data: favorites = [], isLoading: favLoading } = useQuery({
    queryKey: ['favorites', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          supplier_items(
            id,
            display_name,
            brand,
            pack_qty,
            supplier_id,
            price_quotes(pack_price, unit_price_ex_vat, unit_price_inc_vat)
          )
        `)
      if (error) throw error

      return (data || []).map((fav: any) => {
        const item = fav.supplier_items
        const price = item?.price_quotes?.[0]
        return {
          id: item?.id || '',
          name: item?.display_name || '',
          brand: item?.brand || '',
          packSize: item ? `${item.pack_qty}` : '',
          unitPriceExVat: price?.unit_price_ex_vat || 0,
          unitPriceIncVat: price?.unit_price_inc_vat || 0,
          packPriceExVat: price?.pack_price || 0,
          packPriceIncVat: price?.pack_price ? price.pack_price * 1.24 : 0,
          unit: 'unit',
          suppliers: item ? [item.supplier_id] : [],
          stock: true
        }
      })
    },
    enabled: !!profile
  })

  const { data: lastOrder = [], isLoading: lastLoading } = useQuery({
    queryKey: ['last-order', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_lines')
        .select(`
          id,
          quantity,
          supplier_items(
            id,
            display_name,
            brand,
            pack_qty,
            supplier_id,
            price_quotes(pack_price, unit_price_ex_vat, unit_price_inc_vat)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error

      return (data || []).map((line: any) => {
        const item = line.supplier_items
        const price = item?.price_quotes?.[0]
        return {
          id: item?.id || '',
          name: item?.display_name || '',
          brand: item?.brand || '',
          packSize: item ? `${item.pack_qty}` : '',
          unitPriceExVat: price?.unit_price_ex_vat || 0,
          unitPriceIncVat: price?.unit_price_inc_vat || 0,
          packPriceExVat: price?.pack_price || 0,
          packPriceIncVat: price?.pack_price ? price.pack_price * 1.24 : 0,
          unit: 'unit',
          suppliers: item ? [item.supplier_id] : [],
          stock: true,
          lastQuantity: line.quantity
        }
      })
    },
    enabled: !!profile
  })

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
          {favLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading favorites...</div>
          ) : favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {favorites.map(item => (
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
          {lastLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading last order...</div>
          ) : lastOrder.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lastOrder.map(item => (
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
