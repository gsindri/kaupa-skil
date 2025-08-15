
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsProvider';
import { useCart } from '@/contexts/CartProvider';
import { ItemBadges, PriceDisplay } from './ItemCardEnhancements';
import { QuantityControls } from './QuantityControls';

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
    isPremiumBrand?: boolean;
    isDiscounted?: boolean;
    originalPrice?: number;
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

  const unitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat;
  const packPrice = includeVat ? item.packPriceIncVat : item.packPriceExVat;

  const handleAdd = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    
    // Show flyout animation
    setShowFlyout(true);
    setTimeout(() => setShowFlyout(false), 1200);
    
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

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
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
  const hasDeliveryFee = Boolean(item.deliveryFee && item.deliveryFee > 0);
  const hasDeliveryInfo = Boolean(item.cutoffTime && item.deliveryDay);

  return (
    <div
      className={`group relative rounded-xl border border-foreground/5 bg-white hover:bg-muted/30 hover:shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500/40 focus-within:border-brand-500 ${
        compact ? 'p-3 min-h-[88px]' : 'p-4 min-h-[112px]'
      } flex flex-col justify-between`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`${item.name}, ${new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK' }).format(unitPrice)} per ${item.unit}, ${includeVat ? 'including' : 'excluding'} VAT`}
    >
      {/* Stock overlay */}
      {!item.stock && (
        <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center z-10">
          <Badge variant="secondary" className="text-sm">
            Out of Stock
          </Badge>
        </div>
      )}

      {/* Main content */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-4">
          <h3 className="font-semibold text-base leading-tight truncate group-hover:text-brand-700 transition-colors duration-200">
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{item.brand}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{item.packSize}</span>
          </div>
        </div>
        
        <PriceDisplay
          unitPrice={unitPrice}
          packPrice={packPrice}
          unit={item.unit}
          includeVat={includeVat}
          isDiscounted={item.isDiscounted}
          originalPrice={item.originalPrice}
        />
      </div>

      {/* Bottom row: Badges and Controls */}
      <div className="flex items-center justify-between">
        <ItemBadges
          hasCheaperOption={hasCheaperOption}
          hasDeliveryFee={hasDeliveryFee}
          deliveryFee={item.deliveryFee}
          hasDeliveryInfo={hasDeliveryInfo}
          cutoffTime={item.cutoffTime}
          deliveryDay={item.deliveryDay}
          isPremiumBrand={item.isPremiumBrand}
          onCompareItem={onCompareItem}
          itemId={item.id}
        />

        <QuantityControls
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          disabled={!item.stock}
          showFlyout={showFlyout}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
}
