
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Clock, Star, TrendingDown, MoreHorizontal } from 'lucide-react';

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
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {hasCheaperOption && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCompareItem(itemId)}
          className="h-6 px-2 text-xs bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
        >
          <TrendingDown className="h-3 w-3 mr-1" />
          Cheaper available
        </Button>
      )}
      
      {isPremiumBrand && (
        <Badge variant="secondary" className="h-6 px-2 text-xs bg-amber-50 text-amber-700 border border-amber-200">
          <Star className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )}
      
      {hasDeliveryFee && deliveryFee && (
        <Badge variant="outline" className="h-6 px-2 text-xs text-orange-600 border-orange-200">
          <Truck className="h-3 w-3 mr-1" />
          +{new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK', minimumFractionDigits: 0 }).format(deliveryFee)}
        </Badge>
      )}
      
      {hasDeliveryInfo && cutoffTime && deliveryDay && (
        <Badge variant="outline" className="h-6 px-2 text-xs text-green-600 border-green-200">
          <Clock className="h-3 w-3 mr-1" />
          {cutoffTime} → {deliveryDay}
        </Badge>
      )}
    </div>
  );
}

interface PriceDisplayProps {
  unitPrice: number;
  packPrice: number;
  unit: string;
  includeVat: boolean;
  isDiscounted?: boolean;
  originalPrice?: number;
  compact?: boolean;
}

export function PriceDisplay({
  unitPrice,
  packPrice,
  unit,
  includeVat,
  isDiscounted,
  originalPrice,
  compact = false
}: PriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={`text-right ${compact ? 'space-y-0.5' : 'space-y-1'}`}>
      {/* Main pack price - most prominent */}
      <div className="flex items-center gap-2 justify-end">
        {isDiscounted && originalPrice && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(originalPrice)}
          </span>
        )}
        <div className={`font-bold ${compact ? 'text-lg' : 'text-xl'} text-foreground leading-none`}>
          {formatPrice(packPrice)}
        </div>
      </div>
      
      {/* Unit price - secondary but clear */}
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground leading-none`}>
        {formatPrice(unitPrice)} per {unit}
      </div>
      
      {/* VAT indicator - subtle */}
      <div className="text-xs text-muted-foreground/70 leading-none">
        {includeVat ? 'inc VAT' : 'ex VAT'}
      </div>
    </div>
  );
}
