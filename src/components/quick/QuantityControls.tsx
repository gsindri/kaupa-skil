
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface QuantityControlsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
  showFlyout?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  addButtonRef?: React.RefObject<HTMLButtonElement>;
}

export function QuantityControls({ 
  quantity, 
  onQuantityChange, 
  disabled, 
  showFlyout,
  onAdd,
  onRemove,
  addButtonRef
}: QuantityControlsProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());

  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuantity(value);

    if (value === '') return;

    const numValue = parseInt(value, 10);
    if (!Number.isNaN(numValue) && numValue >= 0) {
      onQuantityChange(numValue);
    }
  };

  const handleInputBlur = () => {
    if (localQuantity === '') {
      setLocalQuantity(quantity.toString());
      return;
    }

    const numValue = parseInt(localQuantity, 10) || 0;
    setLocalQuantity(Math.max(0, numValue).toString());
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRemove}
        disabled={quantity === 0 || disabled}
        className="h-9 w-9 p-0 rounded-full border hover:bg-muted focus:ring-2 focus:ring-brand-400/60 transition-all duration-200"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <div className="relative">
        <input
          type="number"
          min="0"
          value={localQuantity}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="h-9 w-16 text-center text-sm font-medium rounded-md border focus:outline-none focus:ring-2 focus:ring-brand-400/60 focus:border-brand-500"
          style={{ fontFeatureSettings: '"tnum" 1' }}
          disabled={disabled}
        />
        
        {showFlyout && (
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-brand-600 animate-flyout pointer-events-none">
            +1
          </div>
        )}
      </div>
      
      <Button
        variant="default"
        size="sm"
        onClick={onAdd}
        disabled={disabled}
        className="h-9 w-9 p-0 rounded-full bg-brand-600 hover:bg-brand-700 focus:ring-2 focus:ring-brand-400/60 transition-all duration-200"
        aria-label="Increase quantity"
        ref={addButtonRef}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
