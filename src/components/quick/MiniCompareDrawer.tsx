
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
import { X, TrendingUp } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

interface MiniCompareDrawerProps {
  itemId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock supplier data - replace with actual data
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
    isBest: true
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
    isBest: false
  }
];

export function MiniCompareDrawer({ itemId, isOpen, onClose }: MiniCompareDrawerProps) {
  const { includeVat } = useSettings();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (!itemId) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Compare Options</span>
            </DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-3">
          {mockSupplierOptions.map((option) => (
            <div
              key={option.id}
              className={`border rounded-lg p-4 ${
                option.isBest ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{option.name}</span>
                    {option.isBest && (
                      <Badge variant="default" className="text-xs">
                        Best choice
                      </Badge>
                    )}
                    {!option.stock && (
                      <Badge variant="secondary" className="text-xs">
                        Out of stock
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-muted-foreground">
                      {option.packSize}
                    </span>
                    <span className="font-mono font-semibold">
                      {formatPrice(includeVat ? option.unitPriceIncVat : option.unitPriceExVat)}/L
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {formatPrice(includeVat ? option.packPriceIncVat : option.packPriceExVat)}/pack
                    </span>
                  </div>
                </div>

                <Button
                  variant={option.isBest ? "default" : "outline"}
                  size="sm"
                  disabled={!option.stock}
                  onClick={onClose}
                >
                  Use this supplier
                </Button>
              </div>
            </div>
          ))}

          {/* Delivery Impact Footer */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              If added alone from Metro, order increases by ISK 2,500 after delivery.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
