
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus } from 'lucide-react';
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
    
    addItem({
      id: item.id,
      supplierId: item.suppliers[0], // Default to first supplier
      supplierName: item.suppliers[0], // Mock supplier name
      itemName: item.name,
      sku: item.id,
      packSize: item.packSize,
      packPrice: packPrice,
      unitPriceExVat: item.unitPriceExVat,
      unitPriceIncVat: item.unitPriceIncVat,
      vatRate: 0.24, // Mock VAT rate
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

  return (
    <div
      className={`border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors ${
        compact ? 'py-3' : ''
      }`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${item.name}, ${formatPrice(unitPrice)} per ${item.unit}, ${includeVat ? 'including' : 'excluding'} VAT`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-foreground truncate">{item.name}</h3>
            {!item.stock && (
              <Badge variant="secondary" className="text-xs">
                Out of Stock
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-muted-foreground">{item.brand}</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{item.packSize}</span>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <span className="font-mono font-semibold text-lg">
              {formatPrice(unitPrice)}/{item.unit}
            </span>
            <span className="font-mono text-sm text-muted-foreground">
              {formatPrice(packPrice)}/pack
            </span>
          </div>

          {/* Chips */}
          <div className="flex items-center space-x-2 mt-2">
            {hasCheaperOption && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onCompareItem(item.id)}
                aria-label="View cheaper options"
              >
                Cheaper available
              </Button>
            )}
            
            {hasDeliveryFee && (
              <Badge variant="outline" className="text-xs">
                + {formatPrice(item.deliveryFee!)} delivery
              </Badge>
            )}
            
            {item.cutoffTime && item.deliveryDay && (
              <Badge variant="outline" className="text-xs">
                Order by {item.cutoffTime} for {item.deliveryDay}
              </Badge>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={quantity === 0}
            className="h-10 w-10 p-0"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <span className="font-mono text-lg font-semibold min-w-[2rem] text-center">
            {quantity}
          </span>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleAdd}
            disabled={!item.stock}
            className="h-10 w-10 p-0"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
