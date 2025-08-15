
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Truck, Clock, Star, Award } from 'lucide-react';

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
        <Badge variant="secondary" className="h-5 px-2 bg-amber-50 text-amber-700 border-amber-200">
          <Award className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )}
      
      {hasCheaperOption && (
        <button
          onClick={() => onCompareItem(itemId)}
          className="h-5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-full transition-colors duration-200 flex items-center gap-1 border border-blue-200"
          aria-label="View cheaper options"
        >
          <TrendingDown className="h-3 w-3" />
          <span>Compare</span>
        </button>
      )}
      
      {hasDeliveryFee && deliveryFee && (
        <Badge variant="outline" className="h-5 px-2 text-orange-600 border-orange-200">
          <Truck className="h-3 w-3 mr-1" />
          +{formatPrice(deliveryFee)}
        </Badge>
      )}
      
      {hasDeliveryInfo && cutoffTime && deliveryDay && (
        <Badge variant="outline" className="h-5 px-2 text-green-600 border-green-200">
          <Clock className="h-3 w-3 mr-1" />
          By {cutoffTime}
        </Badge>
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
    <div className="text-right">
      <div className="flex items-center justify-end gap-2">
        {isDiscounted && originalPrice && (
          <span className="text-xs text-muted-foreground line-through" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {formatPrice(originalPrice)}
          </span>
        )}
        <div className="font-semibold text-lg text-foreground" style={{ fontFeatureSettings: '"tnum" 1' }}>
          {formatPrice(unitPrice)}/{unit}
        </div>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5" style={{ fontFeatureSettings: '"tnum" 1' }}>
        {formatPrice(packPrice)}/pack
      </div>
      <div className="text-xs text-muted-foreground opacity-75">
        {includeVat ? 'inc VAT' : 'ex VAT'}
      </div>
    </div>
  )
}
