
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Truck, AlertTriangle } from 'lucide-react'
import type { DeliveryCalculation } from '@/lib/types/delivery'

interface DeliveryFeeIndicatorProps {
  calculation: DeliveryCalculation
  variant?: 'inline' | 'detailed'
}

export function DeliveryFeeIndicator({ calculation, variant = 'inline' }: DeliveryFeeIndicatorProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (calculation.total_delivery_cost === 0) {
    return (
      <Badge variant="secondary" className="text-green-600 bg-green-50">
        <Truck className="h-3 w-3 mr-1" />
        Free delivery
      </Badge>
    )
  }

  if (variant === 'inline') {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        +{formatPrice(calculation.total_delivery_cost)} delivery
      </Badge>
    )
  }

  return (
    <div className="text-sm text-muted-foreground space-y-1">
      <div className="flex items-center justify-between">
        <span>Delivery fee:</span>
        <span className="font-medium">{formatPrice(calculation.delivery_fee)}</span>
      </div>
      
      {calculation.fuel_surcharge > 0 && (
        <div className="flex items-center justify-between">
          <span>Fuel surcharge:</span>
          <span className="font-medium">{formatPrice(calculation.fuel_surcharge)}</span>
        </div>
      )}
      
      {calculation.pallet_deposit > 0 && (
        <div className="flex items-center justify-between">
          <span>Pallet deposit:</span>
          <span className="font-medium">{formatPrice(calculation.pallet_deposit)}</span>
        </div>
      )}

      {calculation.amount_to_free_delivery && (
        <div className="text-xs text-blue-600 mt-2">
          Add {formatPrice(calculation.amount_to_free_delivery)} more for free delivery
        </div>
      )}
    </div>
  )
}
