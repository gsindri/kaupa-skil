
import React, { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { ItemBadges, PriceDisplay } from './ItemCardEnhancements'
import { QuantityControls } from './QuantityControls'
import { useSettings } from '@/contexts/useSettings'
import { useCart } from '@/contexts/useBasket'
import { MiniCompareDrawer } from './MiniCompareDrawer'

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
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const pressTimer = useRef<number>();
  const { includeVat } = useSettings();
  const { addItem, items: cartItems } = useCart();
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const cartItem = cartItems.find(i => i.supplierItemId === item.id);
  const cartQuantity = cartItem?.quantity ?? 0;

  useEffect(() => {
    setQuantity(cartQuantity);
  }, [cartQuantity]);

  const unitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat;
  const packPrice = includeVat ? item.packPriceIncVat : item.packPriceExVat;

  const startPress = () => {
    pressTimer.current = window.setTimeout(() => {
      setIsCompareOpen(true);
    }, 600);
  };

  const endPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = undefined;
    }
  };

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
    }, 1, { animateElement: addButtonRef.current || undefined });
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
    <>
    <div
      className={`group relative rounded-xl border border-border/60 bg-card hover:bg-accent/30 hover:shadow-md hover:border-border transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-500/50 focus-within:border-brand-500 ${
        compact ? 'p-3 min-h-[100px]' : 'p-4 min-h-[120px]'
      } flex flex-col justify-between`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`${item.name}, ${new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK' }).format(unitPrice)} per ${item.unit}, ${includeVat ? 'including' : 'excluding'} VAT`}
    >
      {cartQuantity > 0 && (
        <span className="absolute top-2 right-2 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs text-white">
          {cartQuantity}
        </span>
      )}
      {/* Stock overlay */}
      {!item.stock && (
        <div className="absolute inset-0 bg-background/85 rounded-xl flex items-center justify-center z-10 backdrop-blur-sm">
          <Badge variant="secondary" className="text-sm font-medium">
            Out of Stock
          </Badge>
        </div>
      )}

      {/* Top section: Image, Product info and price */}
      <div className="flex items-start gap-4 mb-3">
        <img
          src="/placeholder.svg"
          alt={item.name}
          className={`${compact ? 'w-16 h-16' : 'w-20 h-20'} rounded-md object-cover select-none`}
          onDoubleClick={handleAdd}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onTouchMove={endPress}
        />
        <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${compact ? 'text-sm' : 'text-base'} leading-tight text-foreground group-hover:text-brand-700 transition-colors duration-200 mb-1`}>
              {item.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground font-medium`}>
                {item.brand}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                {item.packSize}
              </span>
            </div>
          </div>

          <PriceDisplay
            unitPrice={unitPrice}
            packPrice={packPrice}
            unit={item.unit}
            includeVat={includeVat}
            isDiscounted={item.isDiscounted}
            originalPrice={item.originalPrice}
            compact={compact}
          />
        </div>
      </div>

      {/* Bottom section: Badges and Controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
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
        </div>

        <div className="flex-shrink-0">
          <QuantityControls
            quantity={quantity}
            onQuantityChange={handleQuantityChange}
            disabled={!item.stock}
            showFlyout={showFlyout}
            onAdd={handleAdd}
            onRemove={handleRemove}
            addButtonRef={addButtonRef}
          />
        </div>
      </div>
    </div>
    <MiniCompareDrawer itemId={item.id} isOpen={isCompareOpen} onClose={() => setIsCompareOpen(false)} />
    </>
  );
}
