
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  allItems: any[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAddToCart: (quantity: number) => void;
  onBulkRemoveFromCart: () => void;
}

export function BulkActions({
  selectedItems,
  allItems,
  onSelectAll,
  onClearSelection,
  onBulkAddToCart,
  onBulkRemoveFromCart
}: BulkActionsProps) {
  const isAllSelected = selectedItems.length === allItems.length && allItems.length > 0;
  const isSomeSelected = selectedItems.length > 0 && selectedItems.length < allItems.length;

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el && el instanceof HTMLInputElement) {
                el.indeterminate = isSomeSelected;
              }
            }}
            onCheckedChange={isAllSelected ? onClearSelection : onSelectAll}
          />
          <Badge variant="secondary" className="px-2 py-1">
            {selectedItems.length} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAddToCart(1)}
            className="gap-2"
            disabled={selectedItems.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add to Cart
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkRemoveFromCart}
            className="gap-2 text-destructive hover:text-destructive"
            disabled={selectedItems.length === 0}
          >
            <Minus className="h-4 w-4" />
            Remove
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
