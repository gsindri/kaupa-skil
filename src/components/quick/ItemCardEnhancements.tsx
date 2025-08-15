
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, Award } from 'lucide-react';

interface ItemBadgesProps {
  hasCheaperOption: boolean;
  hasDeliveryFee: boolean;
  deliveryFee?: number;
  hasDeliveryInfo: boolean;
  cutoffTime?: string;
  deliveryDay?: string;
  isPremiumBrand?: boolean;
  onCompareItem: (itemId: string) => void;
  itemId: string;
}

export function ItemBadges({ 
  hasCheaperOption, 
  hasDeliveryFee, 
  deliveryFee, 
  hasDeliveryInfo, 
  cutoffTime, 
  deliveryDay,
  isPremiumBrand,
  onCompareItem,
  itemId 
}: ItemBadgesProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isPremiumBrand && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/70 text-xs">
          <Award className="h-3 w-3" />
          Premium
        </div>
      )}
      
      {hasCheaperOption && (
        <button
          onClick={() => onCompareItem(itemId)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs transition-colors duration-200 border border-blue-200/50"
          aria-label="View cheaper options"
        >
          Cheaper available
        </button>
      )}
      
      {hasDeliveryFee && deliveryFee && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/70 text-xs">
          <Truck className="h-3 w-3" />
          +{formatPrice(deliveryFee)}
        </div>
      )}
      
      {hasDeliveryInfo && cutoffTime && deliveryDay && (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-foreground/5 text-foreground/70 text-xs">
          <Clock className="h-3 w-3" />
          By {cutoffTime}
        </div>
      )}
    </div>
  )
}

interface PriceDisplayProps {
  unitPrice: number;
  packPrice: number;
  unit: string;
  includeVat: boolean;
  isDiscounted?: boolean;
  originalPrice?: number;
}

export function PriceDisplay({ 
  unitPrice, 
  packPrice, 
  unit, 
  includeVat, 
  isDiscounted, 
  originalPrice 
}: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="text-right" style={{ fontFeatureSettings: '"tnum" 1' }}>
      <div className="flex items-center justify-end gap-2">
        {isDiscounted && originalPrice && (
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
        <div className="font-semibold text-lg text-foreground">
          {formatPrice(unitPrice)}/{unit}
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        {formatPrice(packPrice)}/pack
      </div>
      <div className="text-xs text-muted-foreground opacity-75">
        {includeVat ? 'inc VAT' : 'ex VAT'}
      </div>
    </div>
  )
}
