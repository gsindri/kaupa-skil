import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'

export function MiniCart() {
  const { items, getTotalItems, getTotalPrice, setIsDrawerOpen } = useCart()
  const { includeVat } = useSettings()
  const [open, setOpen] = useState(false)

  const cartCount = getTotalItems()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={() => setOpen(true)}>
        <Button
          variant="ghost"
          size="sm"
          className="relative flex-shrink-0 active:translate-y-[1px]"
          onClick={e => {
            e.preventDefault()
            setOpen(false)
            setIsDrawerOpen(true)
          }}
        >
          <ShoppingCart className="h-5 w-5" />
          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-brand-600 px-1 text-[10px] text-white flex items-center justify-center"
            >
              {cartCount}
            </span>
          )}
          <span className="hidden sm:inline ml-2">Cart</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end" sideOffset={8} onMouseLeave={() => setOpen(false)}>
        {cartCount === 0 ? (
          <div className="text-sm text-muted-foreground">Cart is empty</div>
        ) : (
          <div className="space-y-2">
            <div className="space-y-1 text-sm">
              {items.slice(0, 3).map(item => (
                <div key={item.supplierItemId} className="flex justify-between">
                  <span className="truncate pr-2 flex-1">{item.itemName}</span>
                  <span className="text-muted-foreground">{item.quantity}×</span>
                </div>
              ))}
              {items.length > 3 && (
                <div className="text-xs text-muted-foreground">+ {items.length - 3} more</div>
              )}
            </div>
            <div className="flex justify-between text-sm font-medium pt-2 border-t">
              <span>Subtotal</span>
              <span className="font-mono">{formatPrice(getTotalPrice(includeVat))}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false)
                setIsDrawerOpen(true)
              }}
            >
              View cart
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default MiniCart
