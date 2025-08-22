
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import { useDeliveryCalculation } from '@/hooks/useDeliveryOptimization';
import { useCart } from '@/contexts/useBasket';
import { useSettings } from '@/contexts/useSettings';

export function EnhancedCartIntegration() {
  const { items, getTotalItems, getTotalPrice, setIsDrawerOpen } = useCart();
  const { includeVat } = useSettings();
  const { data: deliveryCalculations = [] } = useDeliveryCalculation();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const totalValue = getTotalPrice(includeVat);
  const totalDeliveryFees = deliveryCalculations.reduce((sum, calc) => sum + calc.total_delivery_cost, 0);
  const grandTotal = totalValue + totalDeliveryFees;

  // Find delivery optimization opportunities
  const optimizationOpportunities = deliveryCalculations.filter(
    calc => calc.is_under_threshold && calc.amount_to_free_delivery
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <Card className="sticky bottom-4 mx-4 shadow-lg border-2 border-brand-200 bg-gradient-to-r from-brand-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand-600" />
            <span>Cart Summary</span>
            <Badge variant="secondary" className="bg-brand-100 text-brand-700">
              {getTotalItems()} items
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDrawerOpen(true)}
            className="text-xs"
          >
            View Details
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Price Summary */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Items total:</span>
            <span className="font-mono">{formatPrice(totalValue)}</span>
          </div>
          {totalDeliveryFees > 0 && (
            <div className="flex justify-between text-sm text-orange-600">
              <span>Delivery fees:</span>
              <span className="font-mono">{formatPrice(totalDeliveryFees)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium pt-1 border-t">
            <span>Total:</span>
            <span className="font-mono">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Delivery Optimization Alerts */}
        {optimizationOpportunities.length > 0 && (
          <div className="space-y-2">
            {optimizationOpportunities.slice(0, 2).map((opportunity) => (
              <div key={opportunity.supplier_id} className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 text-xs">
                    <div className="font-medium text-orange-800">
                      Save {formatPrice(opportunity.delivery_fee)} on {opportunity.supplier_name}
                    </div>
                    <div className="text-orange-700">
                      Add {formatPrice(opportunity.amount_to_free_delivery!)} more for free delivery
                    </div>
                    <Progress
                      value={
                        opportunity.threshold_amount
                          ? (opportunity.subtotal_ex_vat / opportunity.threshold_amount) * 100
                          : 0
                      }
                      className="mt-1 h-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-brand-600 hover:bg-brand-700"
            onClick={() => setIsDrawerOpen(true)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Review & Send
          </Button>
        </div>

        {/* Delivery Summary */}
        {deliveryCalculations.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Truck className="h-3 w-3" />
              <span>Delivery Summary</span>
            </div>
            <div className="space-y-1">
              {deliveryCalculations.map((calc) => (
                <div key={calc.supplier_id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{calc.supplier_name}</span>
                  <div className="flex items-center gap-1">
                    {calc.next_delivery_day && (
                      <span className="text-muted-foreground">{calc.next_delivery_day}</span>
                    )}
                    {calc.total_delivery_cost === 0 ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <span className="text-orange-600">+{formatPrice(calc.total_delivery_cost)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
