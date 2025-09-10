import React, { useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getCachedImageUrl } from '@/services/ImageCache'
import { PLACEHOLDER_IMAGE } from '@/lib/images'
import { cn } from '@/lib/utils'
import { QuantityStepper } from './QuantityStepper'
import { formatPrice } from '@/lib/formatPrice'

export function MiniCart() {
  const {
    items,
    getTotalItems,
    getTotalPrice,
    setIsDrawerOpen,
    updateQuantity,
    removeItem
  } = useCart()
  const { includeVat } = useSettings()
  const [open, setOpen] = useState(false)
  const [keyboardNavigationActive, setKeyboardNavigationActive] = useState(false)
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const cartCount = getTotalItems()

  const getItemDisplayName = (item: any) => {
    return (
      item.itemName ||
      item.displayName ||
      item.name ||
      item.title ||
      item.productName ||
      'Unknown item'
    )
  }

  const handleRemove = (index: number) => {
    const item = items[index]
    if (!item) return
    removeItem(item.supplierItemId)
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    index: number
  ) => {
    setKeyboardNavigationActive(true)
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild onMouseEnter={() => setOpen(true)}>
        <Button
          id="mini-cart-button"
          variant="ghost"
          size="sm"
          className="relative inline-flex items-center gap-2 rounded-3 bg-[var(--button-primary)] hover:bg-[var(--button-primary-hover)] px-3 h-11 min-w-[84px] text-white shadow-sm focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_var(--brand-accent)] ui-numeric duration-fast ease-snap motion-reduce:transition-none"
          onClick={e => {
            e.preventDefault()
            setOpen(false)
            setIsDrawerOpen(true)
          }}
        >
          <ShoppingCart className="icon-20" strokeWidth={1.75} />
          <span className="font-semibold">Cart</span>
          {cartCount > 0 && (
            <span
              aria-live="polite"
              className="ml-1 rounded-pill bg-[var(--brand-accent)] text-slate-900 text-xs px-2 py-0.5 min-w-[1.25rem] text-center ui-numeric"
            >
              {cartCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(90vw,360px)] rounded-4 border bg-background shadow-md overflow-hidden"
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
                className="max-h-[320px] overflow-y-auto overflow-x-hidden py-1 px-1 divide-y divide-border"
                style={{ scrollbarGutter: 'stable' }}
              >
                {items.map((it, index) => {
                  const displayName = getItemDisplayName(it)
                  return (
                    <div
                      key={it.supplierItemId}
                      ref={el => (rowRefs.current[index] = el)}
                      tabIndex={keyboardNavigationActive ? 0 : -1}
                      onKeyDown={e => handleKeyDown(e, index)}
                      className={cn(
                        "grid items-center gap-2 grid-cols-[40px,minmax(0,1fr),120px] md:grid-cols-[40px,minmax(0,1fr),128px] px-2 py-2 hover:bg-muted/50 focus-within:bg-muted/50",
                        it.quantity === 0 && "bg-red-50 text-red-700"
                      )}
                    >
                    <img
                      src={getCachedImageUrl(it.image) || PLACEHOLDER_IMAGE}
                      alt=""
                      className="h-9 w-9 md:h-10 md:w-10 rounded object-cover bg-muted/40"
                    />
                    <div className="min-w-0 pr-4 md:pr-6">
                      <p
                        className="text-sm md:text-[15px] font-medium leading-tight line-clamp-2"
                        title={displayName}
                      >
                        {displayName}
                      </p>
                      <div className="mt-[-2px] flex items-baseline justify-between text-xs text-muted-foreground">
                        <span className="flex-1 truncate">
                          {it.packSize}
                          {it.supplierName && ` • ${it.supplierName}`}
                        </span>
                        {(() => {
                          const unitPrice = includeVat ? it.unitPriceIncVat : it.unitPriceExVat
                          const lineTotal = unitPrice != null ? unitPrice * it.quantity : null
                          if (lineTotal == null) {
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-2 tabular-nums whitespace-nowrap">kr —</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {`Connect ${it.supplierName} to see price.`}
                                </TooltipContent>
                              </Tooltip>
                            )
                          }
                          return (
                            <span className="ml-2 tabular-nums whitespace-nowrap">
                              {formatPrice(lineTotal)}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <QuantityStepper
                        quantity={it.quantity}
                        onChange={qty =>
                          updateQuantity(it.supplierItemId, qty)
                        }
                        label={displayName}
                        className="!w-[84px] md:!w-[92px]"
                      />
                      <button
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/50"
                        aria-label={`Remove ${displayName}`}
                        onClick={() => handleRemove(index)}
                      >
                        <Trash2 className="h-4 w-4 stroke-[1.5]" />
                      </button>
                    </div>
                  </div>
                )
              })}
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
