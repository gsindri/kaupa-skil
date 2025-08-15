
import React from 'react';

interface EnhancedPriceDisplayProps {
  unitPrice: number;
  packPrice: number;
  unit: string;
  includeVat: boolean;
  isDiscounted?: boolean;
  originalPrice?: number;
  compact?: boolean;
}

export function EnhancedPriceDisplay({
  unitPrice,
  packPrice,
  unit,
  includeVat,
  isDiscounted,
  originalPrice,
  compact = false
}: EnhancedPriceDisplayProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="text-right space-y-1">
      {/* Unit price - PRIMARY, large, right-aligned */}
      <div className="flex items-center gap-2 justify-end">
        {isDiscounted && originalPrice && (
          <span className="text-sm text-muted-foreground line-through font-mono" style={{ fontFeatureSettings: '"tnum" 1' }}>
            {formatPrice(originalPrice)}
          </span>
        )}
        <div className="font-bold text-2xl text-foreground leading-none font-mono" style={{ fontFeatureSettings: '"tnum" 1' }}>
          {formatPrice(unitPrice)}
        </div>
        <span className="text-lg text-muted-foreground font-medium">
          /{unit}
        </span>
      </div>
      
      {/* Pack price - secondary, smaller beneath */}
      <div className="text-sm text-muted-foreground leading-none font-mono" style={{ fontFeatureSettings: '"tnum" 1' }}>
        {formatPrice(packPrice)} per pack
      </div>
      
      {/* VAT indicator - subtle */}
      <div className="text-xs text-muted-foreground/70 leading-none">
        {includeVat ? 'inc VAT' : 'ex VAT'}
      </div>
    </div>
  );
}
