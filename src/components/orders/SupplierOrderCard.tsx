
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2 } from 'lucide-react'
import type { CartItem } from '@/lib/types'

interface SupplierOrderCardProps {
  supplierId: string
  supplierName: string
  items: CartItem[]
  totalExVat: number
  totalIncVat: number
  vatAmount: number
  onUpdateQuantity: (supplierItemId: string, quantity: number) => void
  onRemoveItem: (supplierItemId: string) => void
  formatPrice: (price: number) => string
}

export function SupplierOrderCard({
  supplierId,
  supplierName,
  items,
  totalExVat,
  totalIncVat,
  vatAmount,
  onUpdateQuantity,
  onRemoveItem,
  formatPrice
}: SupplierOrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{supplierName}</span>
          <Badge variant="outline">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.supplierItemId} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{item.itemName}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {item.sku} • {item.packSize}
                </div>
                <div className="text-sm font-mono tabular-nums">
                  {formatPrice(item.packPrice)} per pack
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.supplierItemId, item.quantity - 1)}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(item.supplierItemId, parseInt(e.target.value) || 0)}
                    className="w-16 text-center"
                    min="0"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateQuantity(item.supplierItemId, item.quantity + 1)}
                  >
                    +
                  </Button>
                </div>
                
                <div className="text-right">
                  <div className="font-medium font-mono tabular-nums">
                    {formatPrice(item.packPrice * item.quantity)}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.supplierItemId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between text-sm">
            <span>Subtotal (ex VAT):</span>
            <span className="font-mono tabular-nums">{formatPrice(totalExVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT:</span>
            <span className="font-mono tabular-nums">{formatPrice(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total (inc VAT):</span>
            <span className="font-mono tabular-nums">{formatPrice(totalIncVat)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
