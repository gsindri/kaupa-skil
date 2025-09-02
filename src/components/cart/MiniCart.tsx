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
        className="w-[340px] sm:w-[360px] rounded-xl border bg-background shadow-md overflow-hidden"
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
          <React.Fragment>
            <div
              className="max-h-[360px] overflow-y-auto overflow-x-hidden pt-1 pb-2 px-2 pr-3"
              style={{ scrollbarGutter: 'stable' }}
            >
              {items.map((it, index) => (
                <div
                  key={it.supplierItemId}
                  ref={el => (rowRefs.current[index] = el)}
                  tabIndex={0}
                  onKeyDown={e => handleKeyDown(e, index)}
                  className="grid grid-cols-[44px,1fr,auto,auto] md:grid-cols-[56px,1fr,auto,auto] items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/60 transition focus-within:ring-2 focus-within:ring-primary/30"
                >
                  <img
                    src={it.image ?? fallbackImage}
                    alt=""
                    className="h-10 w-10 md:h-12 md:w-12 rounded object-cover bg-muted/40"
                  />
                  <div className="min-w-0">
                      <p
                        className="text-sm md:text-[15px] font-medium leading-snug line-clamp-2 md:line-clamp-1"
                        title={it.itemName || it.displayName}
                      >
                        {it.itemName || it.displayName}
                      </p>
                      <div className="text-xs text-muted-foreground truncate">
                        {it.packSize}
                        {it.supplierName && ` • ${it.supplierName}`}
                      </div>
                    </div>
                  <div className="min-w-[9ch] md:min-w-[11ch] text-right tabular-nums whitespace-nowrap text-sm">
                    {formatPrice(
                      (includeVat ? it.unitPriceIncVat : it.unitPriceExVat) * it.quantity
                    )}
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <button
                      className="h-7 w-7 md:h-8 md:w-8 rounded border"
                      aria-label="Decrease quantity"
                      onClick={() =>
                        updateQuantity(it.supplierItemId, it.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span className="w-8 text-center tabular-nums text-sm">
                      {it.quantity}
                    </span>
                    <button
                      className="h-7 w-7 md:h-8 md:w-8 rounded border"
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
                          className="ml-1 h-7 w-7 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 border-t bg-background px-3 py-2">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">{subtotal}</span>
              </div>
              <Button
                size="lg"
                className="w-full h-11 rounded-xl"
                onClick={() => {
                  setOpen(false)
                  setIsDrawerOpen(true)
                }}
              >
                View cart
              </Button>
            </div>
          </React.Fragment>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default MiniCart
