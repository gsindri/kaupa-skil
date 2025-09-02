import React, { useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

export function MiniCart() {
  const {
    items,
    getTotalItems,
    getTotalPrice,
    setIsDrawerOpen,
    updateQuantity,
    removeItem,
    restoreItems
  } = useCart()
  const { includeVat } = useSettings()
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const cartCount = getTotalItems()

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)

  const handleRemove = (index: number) => {
    const item = items[index]
    if (!item) return
    const previous = [...items]
    removeItem(item.supplierItemId)
    toast({
      description: `Removed ${item.itemName}`,
      action: (
        <ToastAction altText="Undo" onClick={() => restoreItems(previous)}>
          Undo
        </ToastAction>
      )
    })
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      rowRefs.current[index + 1]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      rowRefs.current[index - 1]?.focus()
    } else if (e.key === 'Delete') {
      e.preventDefault()
      handleRemove(index)
    }
  }

  const subtotal = formatPrice(getTotalPrice(includeVat))
  const fallbackImage = '/placeholder.svg'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={() => setOpen(true)}>
        <Button
          id="mini-cart-button"
          variant="outline"
          size="sm"
          className="relative flex-shrink-0 border-border focus-visible:ring-brand/50"
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
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] text-white"
            >
              {cartCount}
            </span>
          )}
          <span className="ml-2 hidden sm:inline">Cart</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] sm:w-[360px]"
        side="bottom"
        sideOffset={8}
        collisionPadding={8}
        sticky="partial"
        onMouseLeave={() => setOpen(false)}
      >
        {cartCount === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">Your cart is empty</p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/catalog">Browse catalog</Link>
            </Button>
          </div>
        ) : (
          <div className="w-[320px] sm:w-[360px]">
            <div className="divide-y max-h-[360px] overflow-auto pr-1">
              {items.map((it, index) => (
                <div
                  key={it.supplierItemId}
                  ref={el => (rowRefs.current[index] = el)}
                  tabIndex={0}
                  onKeyDown={e => handleKeyDown(e, index)}
                  className="grid grid-cols-[40px,1fr,auto] items-center gap-3 p-2 group focus:bg-accent/40 focus:outline-none"
                >
                  <img
                    src={it.image ?? fallbackImage}
                    alt=""
                    className="h-10 w-10 rounded object-cover bg-muted/50"
                  />
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-medium leading-tight"
                      title={it.itemName}
                    >
                      {it.itemName}
                    </p>
                    {it.packSize && (
                      <p className="truncate text-xs text-muted-foreground">
                        {it.packSize}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="h-7 w-7 rounded border text-sm hover:bg-accent"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateQuantity(it.supplierItemId, it.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span className="w-6 text-right text-sm tabular-nums">
                      {it.quantity}×
                    </span>
                    <button
                      className="h-7 w-7 rounded border text-sm hover:bg-accent"
                      aria-label="Increase quantity"
                      onClick={() =>
                        updateQuantity(it.supplierItemId, it.quantity + 1)
                      }
                    >
                      +
                    </button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          aria-label="Remove item"
                          onClick={() => handleRemove(index)}
                          className="ml-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 mt-2 space-y-2 border-t bg-background p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{subtotal}</span>
              </div>
              <Button
                size="lg"
                className="h-11 w-full rounded-xl"
                onClick={() => {
                  setOpen(false)
                  setIsDrawerOpen(true)
                }}
              >
                View cart
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default MiniCart
