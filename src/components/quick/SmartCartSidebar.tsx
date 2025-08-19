
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  TrendingUp, 
  Truck, 
  AlertTriangle,
  Plus,
  Lightbulb
} from 'lucide-react';
import { useCart } from '@/contexts/BasketProviderUtils';
import { useSettings } from '@/contexts/useSettings';

interface SmartCartSidebarProps {
  className?: string;
}

export function SmartCartSidebar({ className = "" }: SmartCartSidebarProps) {
  const { items, getTotalItems, getTotalPrice, addItem } = useCart();
  const { includeVat } = useSettings();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Mock delivery optimization data
  const deliveryOptimization = {
    currentDeliveryFees: 3500,
    optimizedDeliveryFees: 1500,
    potentialSavings: 2000,
    suggestions: [
      {
        type: 'consolidate',
        message: 'Add ISK 1,200 more from Metro to get free delivery',
        items: ['Organic Milk 1L', 'Premium Bread']
      },
      {
        type: 'alternative',
        message: 'Switch 2 items to Costco to save ISK 800',
        items: ['Olive Oil', 'Pasta']
      }
    ]
  };

  const handleAddSuggestedItem = (itemName: string) => {
    // Mock adding suggested item
    addItem({
      id: `suggested-${Date.now()}`,
      supplierId: 'metro',
      supplierName: 'Metro',
      itemName: itemName,
      sku: `SKU-${Date.now()}`,
      packSize: '1 unit',
      packPrice: 400,
      unitPriceExVat: 400,
      unitPriceIncVat: 496,
      vatRate: 0.24,
      unit: 'pc',
      supplierItemId: `suggested-${Date.now()}`,
      displayName: itemName,
      packQty: 1
    });
  };

  if (getTotalItems() === 0) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Cart Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart ({getTotalItems()} items)
            </span>
            <span className="font-mono text-sm">
              {formatPrice(getTotalPrice(includeVat))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.slice(0, 3).map((item) => (
            <div key={item.supplierItemId} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.itemName}</div>
                <div className="text-muted-foreground text-xs">
                  {item.quantity}× {item.packSize} • {item.supplierName}
                </div>
              </div>
              <div className="font-mono text-xs">
                {formatPrice((includeVat ? item.unitPriceIncVat : item.unitPriceExVat) * item.quantity)}
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{items.length - 3} more items
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Optimization */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
            <TrendingUp className="h-4 w-4" />
            Delivery Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Current delivery fees:</span>
            <span className="font-mono text-blue-900">
              {formatPrice(deliveryOptimization.currentDeliveryFees)}
            </span>
          </div>
          
          {deliveryOptimization.potentialSavings > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <div className="text-xs text-green-800">
                Save {formatPrice(deliveryOptimization.potentialSavings)} on delivery
              </div>
            </div>
          )}

          <div className="space-y-2">
            {deliveryOptimization.suggestions.map((suggestion, index) => (
              <div key={index} className="text-xs space-y-1">
                <div className="text-blue-700 font-medium">{suggestion.message}</div>
                <div className="flex flex-wrap gap-1">
                  {suggestion.items.map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs px-2 bg-white hover:bg-blue-100 border-blue-200"
                      onClick={() => handleAddSuggestedItem(item)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {item}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <Button 
            className="w-full" 
            onClick={() => {/* Navigate to checkout */}}
          >
            Proceed to Checkout
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              Save as List
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Share Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
