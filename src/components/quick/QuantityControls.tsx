
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
}

export function QuantityControls({ 
  quantity, 
  onQuantityChange, 
  disabled, 
  showFlyout,
  onAdd,
  onRemove 
}: QuantityControlsProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity.toString());

  useEffect(() => {
    setLocalQuantity(quantity.toString());
  }, [quantity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuantity(value);
    
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      onQuantityChange(numValue);
    }
  };

  const handleInputBlur = () => {
    const numValue = parseInt(localQuantity) || 0;
    setLocalQuantity(Math.max(0, numValue).toString());
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onRemove}
        disabled={quantity === 0 || disabled}
        className="h-8 w-8 p-0 rounded-full hover:bg-muted/80 transition-colors duration-200"
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      
      <div className="relative">
        <input
          type="number"
          min="0"
          value={localQuantity}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-12 h-8 text-center text-sm font-medium bg-transparent border border-border rounded focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
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
        className="h-8 w-8 p-0 rounded-full bg-brand-500 hover:bg-brand-600 transition-all duration-200 hover:scale-105"
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
