
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Calendar } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { CartItem } from '@/lib/types'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { SendOrderButton } from '@/components/cart/SendOrderButton'

interface SupplierOrderCardProps {
  supplierId: string
  supplierName: string
  supplierEmail?: string | null
  logoUrl?: string | null
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
  minOrderValue?: number
  amountToFreeDelivery?: number
  onRemoveItem: (supplierItemId: string) => void
  formatPrice: (price: number) => string
  hasUnknownPrices?: boolean
}

export function SupplierOrderCard({
  supplierId,
  supplierName,
  supplierEmail,
  logoUrl,
  items,
  subtotal,
  deliveryFee,
  total,
  minOrderValue = 0,
  amountToFreeDelivery,
  onRemoveItem,
  formatPrice,
  hasUnknownPrices
}: SupplierOrderCardProps) {
  const supplierInitials = (supplierName || '??').slice(0, 2).toUpperCase()
  const isMinOrderMet = subtotal >= minOrderValue

  // Mock data for PO and Date as requested
  const poNumber = `PO-2025-${Math.floor(1000 + Math.random() * 9000)}`
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <Card className="overflow-hidden border border-slate-200 rounded-xl shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border bg-white">
            {logoUrl ? (
              <AvatarImage src={logoUrl} alt={supplierName} className="object-contain p-1" />
            ) : (
              <AvatarFallback>{supplierInitials}</AvatarFallback>
            )}
          </Avatar>

          <div className="space-y-1">
            <h3 className="font-bold leading-none text-foreground">{supplierName}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="h-6 gap-1 rounded-md px-2 font-mono text-[11px] font-normal text-muted-foreground bg-white border border-slate-200">
                {poNumber}
              </Badge>
              <span className="text-[11px] text-muted-foreground">•</span>
              <span className="text-[11px] text-muted-foreground">{items.length} items</span>
              <Badge variant="outline" className="h-6 gap-1 rounded-md border-slate-200 bg-white px-2 text-[11px] font-normal text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {date}
              </Badge>
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Value</p>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 leading-none">
              {hasUnknownPrices ? 'Pending' : formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Items List */}
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.supplierItemId} className="flex items-center gap-4 p-4 hover:bg-slate-50/50">
              {/* Image */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                {item.image ? (
                  <img src={item.image} alt={item.itemName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
                    <div className="h-4 w-4 rounded-full bg-current opacity-20" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{item.displayName || item.itemName}</p>
                <p className="truncate text-xs text-muted-foreground font-mono">{item.sku}</p>
              </div>

              {/* Quantity */}
              <div className="w-32 shrink-0">
                <QuantityStepper
                  supplierItemId={item.supplierItemId}
                  quantity={item.quantity}
                  min={1}
                  label={item.itemName}
                  supplier={supplierName}
                  className="h-8"
                />
                <p className="mt-1 text-center text-[10px] text-muted-foreground">{item.packSize}</p>
              </div>

              {/* Price */}
              <div className="w-24 shrink-0 text-right">
                <p className="font-medium tabular-nums text-slate-900">
                  {formatPrice(item.packPrice * item.quantity)}
                </p>
              </div>

              {/* Actions */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                onClick={() => onRemoveItem(item.supplierItemId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!isMinOrderMet ? (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700">
                <span className="mr-1">⚠️</span> Min. order {formatPrice(minOrderValue)}
              </Badge>
            ) : hasUnknownPrices ? (
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-50 hover:text-orange-700">
                <span className="mr-1">⚠️</span> Incomplete
              </Badge>
            ) : (
              <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700">
                <span className="mr-1">✓</span> Draft Complete
              </Badge>
            )}
          </div>

          <SendOrderButton
            supplierId={supplierId}
            supplierName={supplierName}
            supplierEmail={supplierEmail}
            supplierLogoUrl={logoUrl}
            cartItems={items}
            subtotal={subtotal}
            minOrderValue={minOrderValue}
          />
        </div>
      </CardContent>
    </Card >
  )
}
