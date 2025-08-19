import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Truck, Clock, AlertCircle } from 'lucide-react';
import { useSettings } from '@/contexts/useSettings';
import { useCart } from '@/contexts/BasketProviderUtils';

interface MiniCompareDrawerProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Enhanced mock supplier data with delivery optimization
const mockSupplierOptions = [
  {
    id: 'costco',
    name: 'Costco',
    packSize: '12×1L',
    packPriceExVat: 2160,
    packPriceIncVat: 2676,
    unitPriceExVat: 180,
    unitPriceIncVat: 223,
    stock: true,
    deliveryImpact: 0,
    deliveryFee: 0,
    deliveryTime: 'Next day',
    cutoffTime: '14:00',
    isBest: true,
    savings: 500,
    moq: null
  },
  {
    id: 'metro',
    name: 'Metro',
    packSize: '12×1L',
    packPriceExVat: 2340,
    packPriceIncVat: 2901,
    unitPriceExVat: 195,
    unitPriceIncVat: 242,
    stock: true,
    deliveryImpact: 2500,
    deliveryFee: 2500,
    deliveryTime: '2-3 days',
    cutoffTime: '16:00',
    isBest: false,
    savings: 0,
    moq: 5000
  },
  {
    id: 'nordic',
    name: 'Nordic Supply',
    packSize: '6×1L',
    packPriceExVat: 1200,
    packPriceIncVat: 1488,
    unitPriceExVat: 200,
    unitPriceIncVat: 248,
    stock: false,
    deliveryImpact: 1800,
    deliveryFee: 1800,
    deliveryTime: 'Same day',
    cutoffTime: '12:00',
    isBest: false,
    savings: 0,
    moq: null
  }
];

export function MiniCompareDrawer({ itemId, isOpen, onClose }: MiniCompareDrawerProps) {
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

  const handleSelectSupplier = (option: typeof mockSupplierOptions[0]) => {
    if (!itemId || !option.stock) return;
    
    // Add item to cart with selected supplier
    addItem({
      id: `${itemId}-${option.id}`,
      supplierId: option.id,
      supplierName: option.name,
      itemName: `Premium Item from ${option.name}`,
      sku: itemId,
      packSize: option.packSize,
      packPrice: includeVat ? option.packPriceIncVat : option.packPriceExVat,
      unitPriceExVat: option.unitPriceExVat,
      unitPriceIncVat: option.unitPriceIncVat,
      vatRate: 0.24,
      unit: 'L',
      supplierItemId: `${itemId}-${option.id}`,
      displayName: `Premium Item from ${option.name}`,
      packQty: 1
    });
    
    onClose();
  };

  if (!itemId) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Compare Suppliers</span>
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-3 overflow-y-auto">
          {mockSupplierOptions.map((option) => (
            <div
              key={option.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                option.isBest 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : option.stock 
                    ? 'border-border hover:border-border/80 hover:bg-accent/30' 
                    : 'border-border/50 bg-muted/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Supplier header */}
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-base">{option.name}</span>
                    {option.isBest && (
                      <Badge variant="default" className="text-xs">
                        Best Value
                      </Badge>
                    )}
                    {!option.stock && (
                      <Badge variant="secondary" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                    {option.savings > 0 && (
                      <Badge variant="outline" className="text-xs text-green-700 border-green-200">
                        Save {formatPrice(option.savings)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Pricing info */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Pack:</span>
                      <span className="text-sm font-medium">{option.packSize}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Unit:</span>
                      <span className="font-mono font-semibold">
                        {formatPrice(includeVat ? option.unitPriceIncVat : option.unitPriceExVat)}/L
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-mono text-sm">
                        {formatPrice(includeVat ? option.packPriceIncVat : option.packPriceExVat)}
                      </span>
                    </div>
                  </div>

                  {/* Delivery info */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {option.deliveryFee > 0 ? formatPrice(option.deliveryFee) : 'Free delivery'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {option.deliveryTime} (cutoff {option.cutoffTime})
                      </span>
                    </div>
                  </div>

                  {/* Warnings */}
                  {option.moq && (
                    <div className="flex items-center gap-2 text-xs text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>MOQ: {formatPrice(option.moq)}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant={option.isBest ? "default" : "outline"}
                  size="sm"
                  disabled={!option.stock}
                  onClick={() => handleSelectSupplier(option)}
                  className="flex-shrink-0"
                >
                  {option.stock ? 'Select' : 'Notify when available'}
                </Button>
              </div>
            </div>
          ))}

          {/* Delivery optimization summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Order Impact Summary
            </h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• Best option saves ISK 500 vs current cart items</p>
              <p>• Metro option adds ISK 2,500 delivery fee if ordered alone</p>
              <p>• Consider combining with other Metro items to reach free delivery threshold</p>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
