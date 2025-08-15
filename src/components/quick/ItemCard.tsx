
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, TrendingDown, Truck, Clock } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';
import { useCart } from '@/contexts/CartProvider';

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    brand: string;
    packSize: string;
    unitPriceExVat: number;
    unitPriceIncVat: number;
    packPriceExVat: number;
    packPriceIncVat: number;
    unit: string;
    suppliers: string[];
    stock: boolean;
    deliveryFee?: number;
    cutoffTime?: string;
    deliveryDay?: string;
  };
  onCompareItem: (itemId: string) => void;
  userMode: 'just-order' | 'balanced' | 'analytical';
  compact?: boolean;
}

export function ItemCard({ item, onCompareItem, userMode, compact = false }: ItemCardProps) {
  const [quantity, setQuantity] = useState(0);
  const [showFlyout, setShowFlyout] = useState(false);
  const { includeVat } = useSettings();
  const { addItem } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const unitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat;
  const packPrice = includeVat ? item.packPriceIncVat : item.packPriceExVat;

  const handleAdd = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    
    // Show flyout animation
    setShowFlyout(true);
    setTimeout(() => setShowFlyout(false), 150);
    
    addItem({
      id: item.id,
      supplierId: item.suppliers[0],
      supplierName: item.suppliers[0],
      itemName: item.name,
      sku: item.id,
      packSize: item.packSize,
      packPrice: packPrice,
      unitPriceExVat: item.unitPriceExVat,
      unitPriceIncVat: item.unitPriceIncVat,
      vatRate: 0.24,
      unit: item.unit,
      supplierItemId: item.id,
      displayName: item.name,
      packQty: 1
    }, 1);
  };

  const handleRemove = () => {
    if (quantity > 0) {
      setQuantity(Math.max(0, quantity - 1));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleRemove();
    }
  };

  const hasCheaperOption = item.suppliers.length > 1;
  const hasDeliveryFee = item.deliveryFee && item.deliveryFee > 0;
  const hasDeliveryInfo = item.cutoffTime && item.deliveryDay;

  return (
    <div
      className="relative rounded-xl border border-black/5 bg-white hover:bg-muted/30 transition-colors duration-200 p-4 h-24 flex flex-col justify-between"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${item.name}, ${formatPrice(unitPrice)} per ${item.unit}, ${includeVat ? 'including' : 'excluding'} VAT`}
    >
      {/* Flyout animation */}
      {showFlyout && (
        <div className="absolute top-2 right-2 text-sm font-medium text-brand-600 animate-flyout pointer-events-none">
          +1
        </div>
      )}

      <div className="flex items-start justify-between">
        {/* Row 1: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[#0B1220] text-base leading-tight truncate">
                {item.name}
              </h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{item.brand}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{item.packSize}</span>
                {!item.stock && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Badge variant="secondary" className="text-xs h-4 px-1">
                      Out of Stock
                    </Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* Price display */}
            <div className="text-right ml-4">
              <div className="font-semibold text-lg leading-tight" style={{ fontFeatureSettings: '"tnum" 1' }}>
                {formatPrice(unitPrice)}/{item.unit}
              </div>
              <div className="text-xs text-muted-foreground" style={{ fontFeatureSettings: '"tnum" 1' }}>
                {formatPrice(packPrice)}/pack
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Chips and Controls */}
      <div className="flex items-center justify-between mt-2">
        {/* Chips */}
        <div className="flex items-center space-x-2">
          {hasCheaperOption && (
            <button
              onClick={() => onCompareItem(item.id)}
              className="h-3 px-2 bg-foreground/5 hover:bg-foreground/10 text-foreground/70 text-xs rounded-full transition-colors duration-200 flex items-center space-x-1"
              aria-label="View cheaper options"
            >
              <TrendingDown className="h-3 w-3" />
              <span>Cheaper available</span>
            </button>
          )}
          
          {hasDeliveryFee && (
            <div className="h-3 px-2 bg-foreground/5 text-foreground/70 text-xs rounded-full flex items-center space-x-1">
              <Truck className="h-3 w-3" />
              <span>+ {formatPrice(item.deliveryFee!)} delivery</span>
            </div>
          )}
          
          {hasDeliveryInfo && (
            <div className="h-3 px-2 bg-foreground/5 text-foreground/70 text-xs rounded-full flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Order by {item.cutoffTime} for {item.deliveryDay}</span>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={quantity === 0}
            className="h-9 w-9 p-0 rounded-full"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <div className="w-14 text-center">
            <span className="font-medium text-base" style={{ fontFeatureSettings: '"tnum" 1' }}>
              {quantity}
            </span>
          </div>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleAdd}
            disabled={!item.stock}
            className="h-9 w-9 p-0 rounded-full bg-brand-500 hover:bg-brand-600"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
