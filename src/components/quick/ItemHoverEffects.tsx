
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Eye, 
  BarChart3, 
  Heart, 
  Share2, 
  ExternalLink,
  TrendingUp,
  Clock
} from 'lucide-react';

interface ItemHoverActionsProps {
  itemId: string;
  itemName: string;
  onCompareItem: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  onAddToWishlist?: (itemId: string) => void;
  className?: string;
}

export function ItemHoverActions({
  itemId,
  itemName,
  onCompareItem,
  onViewDetails,
  onAddToWishlist,
  className = ""
}: ItemHoverActionsProps) {
  return (
    <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCompareItem(itemId)}
          className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-sm"
          title="Compare prices"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(itemId)}
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-sm"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
        
        {onAddToWishlist && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddToWishlist(itemId)}
            className="h-8 w-8 p-0 bg-background/90 hover:bg-background shadow-sm"
            title="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface QuickInfoTooltipProps {
  item: {
    name: string;
    brand: string;
    lastOrderDate?: string;
    averagePrice?: number;
    priceChange?: number;
    orderFrequency?: string;
  };
  isVisible: boolean;
  position: { x: number; y: number };
}

export function QuickInfoTooltip({ item, isVisible, position }: QuickInfoTooltipProps) {
  if (!isVisible) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 10,
      }}
    >
      <Card className="w-64 shadow-lg border-border/50 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-3 space-y-2">
          <div className="text-sm font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.brand}</div>
          
          {item.lastOrderDate && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>Last ordered: {item.lastOrderDate}</span>
            </div>
          )}
          
          {item.averagePrice && (
            <div className="flex items-center justify-between text-xs">
              <span>Avg price:</span>
              <span className="font-medium">{formatPrice(item.averagePrice)}</span>
            </div>
          )}
          
          {item.priceChange && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className={`h-3 w-3 ${item.priceChange > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <span className={item.priceChange > 0 ? 'text-red-600' : 'text-green-600'}>
                {item.priceChange > 0 ? '+' : ''}{item.priceChange}% vs last order
              </span>
            </div>
          )}
          
          {item.orderFrequency && (
            <Badge variant="secondary" className="text-xs">
              {item.orderFrequency}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
