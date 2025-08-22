
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  X,
  Truck,
  Plus,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingDown
} from 'lucide-react';
import type { OrderDeliveryOptimization } from '@/lib/types/delivery';
import { useCart } from '@/contexts/useBasket';
import { useSettings } from '@/contexts/useSettings';

interface DeliveryOptimizationBannerProps {
  className?: string;
  optimization?: OrderDeliveryOptimization;
  onApplySuggestion?: (suggestionIndex: number) => void;
}

export function DeliveryOptimizationBanner({ 
  className = "", 
  optimization,
  onApplySuggestion 
}: DeliveryOptimizationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { items, addItem } = useCart();
  const { includeVat } = useSettings();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Mock optimization data when no optimization prop is provided
  const defaultOptimizationData = {
    currentFees: 4500,
    optimizedFees: 1500,
    savings: 3000,
    suggestions: [
      {
        id: 'metro-topup',
        type: 'topup',
        title: 'Add ISK 1,200 more from Metro for free delivery',
        description: 'Currently paying ISK 2,500 delivery fee',
        savings: 2500,
        items: [
          { name: 'Organic Milk 1L', price: 195 },
          { name: 'Fresh Bread 500g', price: 320 },
          { name: 'Greek Yogurt 500g', price: 450 }
        ]
      },
      {
        id: 'costco-consolidate',
        type: 'consolidate',
        title: 'Move 3 items to Costco to save ISK 800',
        description: 'Better prices + combine shipments',
        savings: 800,
        items: [
          { name: 'Premium Olive Oil', price: 1200 },
          { name: 'Pasta 500g', price: 280 }
        ]
      }
    ]
  };

  const handleAddSuggestedItem = (itemName: string, price: number) => {
    addItem({
      id: `opt-${Date.now()}`,
      supplierId: 'metro',
      supplierName: 'Metro',
      itemName: itemName,
      sku: `OPT-${Date.now()}`,
      packSize: '1 unit',
      packPrice: price,
      unitPriceExVat: price,
      unitPriceIncVat: Math.round(price * 1.24),
      vatRate: 0.24,
      unit: 'pc',
      supplierItemId: `opt-${Date.now()}`,
      displayName: itemName,
      packQty: 1
    });
  };

  if (isDismissed || items.length === 0) {
    return null;
  }

  // If optimization prop is provided, use structured alerts format
  if (optimization) {
    if (optimization.warnings.length === 0 && optimization.suggestions.length === 0) {
      return null;
    }

    return (
      <div className={`space-y-3 ${className}`}>
        {/* Warnings */}
        {optimization.warnings.map((warning, index) => (
          <Alert key={index} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{warning.message}</span>
                <Badge variant="destructive">
                  +{formatPrice(warning.cost_impact)}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        ))}

        {/* Suggestions */}
        {optimization.suggestions.map((suggestion, index) => (
          <Alert key={index} className="border-blue-200 bg-blue-50">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-800">{suggestion.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingDown className="h-3 w-3 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      Save {formatPrice(suggestion.savings)}
                    </span>
                  </div>
                </div>
                {onApplySuggestion && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApplySuggestion(index)}
                    className="ml-4"
                  >
                    Apply
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  }

  // Default rich banner format
  const optimizationData = defaultOptimizationData;

  return (
    <Card className={`border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900">
                Save {formatPrice(optimizationData.savings)} on delivery
              </h3>
              <p className="text-sm text-orange-700">
                Optimize your order to reduce delivery costs
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-orange-600 hover:text-orange-700"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {optimizationData.suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white/60 rounded-lg p-3 border border-orange-200/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-orange-100 border-orange-300"
                    >
                      Save {formatPrice(suggestion.savings)}
                    </Badge>
                    {suggestion.type === 'topup' && (
                      <Truck className="h-3 w-3 text-orange-600" />
                    )}
                    {suggestion.type === 'consolidate' && (
                      <CheckCircle className="h-3 w-3 text-orange-600" />
                    )}
                  </div>
                  <h4 className="font-medium text-orange-900 text-sm">
                    {suggestion.title}
                  </h4>
                  <p className="text-xs text-orange-700 mt-1">
                    {suggestion.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {suggestion.items.map((item) => (
                  <Button
                    key={item.name}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white hover:bg-orange-50 border-orange-200"
                    onClick={() => handleAddSuggestedItem(item.name, item.price)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {item.name} - {formatPrice(item.price)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 p-2 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-center gap-2 text-xs text-green-800">
            <CheckCircle className="h-3 w-3" />
            <span>
              Current delivery fees: {formatPrice(optimizationData.currentFees)} → 
              Optimized: {formatPrice(optimizationData.optimizedFees)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
