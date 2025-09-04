import React, { useRef, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { getCachedImageUrl } from '@/services/ImageCache'
import { PLACEHOLDER_IMAGE } from '@/lib/images'
import { cn } from '@/lib/utils'

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
  const [keyboardNavigationActive, setKeyboardNavigationActive] = useState(false)
  const { toast } = useToast()
  const rowRefs = useRef<(HTMLDivElement | null)[]>([])

  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [tempQty, setTempQty] = useState<Record<string, string>>({})

  const MIN_QTY = 0
  const MAX_QTY = 9999

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

  const formatPrice = (price: number) => {
    const narrow = new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
    if (narrow.includes('kr')) {
      return narrow.replace('kr.', 'kr')
    }
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      currencyDisplay: 'code',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const handleRemove = (index: number) => {
    const item = items[index]
    if (!item) return
    const previous = [...items]
    removeItem(item.supplierItemId)
    toast({
      description: `Removed ${getItemDisplayName(item)}`,
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
          variant="default"
          size="sm"
          className="relative flex-shrink-0 h-10 px-4 rounded-lg focus-visible:ring-brand/50 hover:shadow-sm transition-shadow"
          onClick={e => {
            e.preventDefault()
            setOpen(false)
            setIsDrawerOpen(true)
          }}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            <span
              aria-live="polite"
              className={`absolute top-0 right-0 flex h-4 min-w-4 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] text-white transition-all ${cartCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            >
              {cartCount}
            </span>
          </div>
          <span className="ml-2 hidden sm:inline font-semibold">Cart</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(90vw,360px)] rounded-xl border bg-background shadow-md overflow-hidden"
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
                  const isEditing = editing[it.supplierItemId]
                  const value = tempQty[it.supplierItemId] ?? String(it.quantity)
                  const numericValue = Number(value)
                  const isInvalid = numericValue > MAX_QTY || numericValue < MIN_QTY

                  const startEdit = () => {
                    setEditing(prev => ({ ...prev, [it.supplierItemId]: true }))
                    setTempQty(prev => ({ ...prev, [it.supplierItemId]: String(it.quantity) }))
                  }

                  const cancelEdit = () => {
                    setEditing(prev => ({ ...prev, [it.supplierItemId]: false }))
                    setTempQty(prev => {
                      const cp = { ...prev }
                      delete cp[it.supplierItemId]
                      return cp
                    })
                  }

                  const commitEdit = () => {
                    const newQty = Math.min(
                      MAX_QTY,
                      Math.max(MIN_QTY, numericValue || 0)
                    )
                    updateQuantity(it.supplierItemId, newQty)
                    cancelEdit()
                  }

                  const handleInputKey = (
                    e: React.KeyboardEvent<HTMLInputElement>
                  ) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitEdit()
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelEdit()
                    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault()
                      const delta = e.shiftKey ? 10 : 1
                      const newVal =
                        numericValue + (e.key === 'ArrowUp' ? delta : -delta)
                      const clamped = Math.min(
                        MAX_QTY,
                        Math.max(MIN_QTY, newVal)
                      )
                      setTempQty(prev => ({
                        ...prev,
                        [it.supplierItemId]: String(clamped),
                      }))
                    }
                  }

                  return (
                    <div
                      key={it.supplierItemId}
                      ref={el => (rowRefs.current[index] = el)}
                      tabIndex={keyboardNavigationActive ? 0 : -1}
                      onKeyDown={e => handleKeyDown(e, index)}
                      className={cn(
                        "grid items-center gap-2 grid-cols-[40px,minmax(0,1fr),128px] md:grid-cols-[40px,minmax(0,1fr),144px] px-2 py-2 hover:bg-muted/50 focus-within:ring-2 focus-within:ring-brand/50",
                        it.quantity === 0 && "bg-destructive/10"
                      )}
                    >
                    <img
                      src={getCachedImageUrl(it.image) || PLACEHOLDER_IMAGE}
                      alt=""
                      className="h-9 w-9 md:h-10 md:w-10 rounded object-cover bg-muted/40"
                    />
                    <div className="min-w-0">
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
                        <span className="ml-2 tabular-nums whitespace-nowrap">
                          {formatPrice(
                            (includeVat ? it.unitPriceIncVat : it.unitPriceExVat) * it.quantity
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "relative inline-flex h-7 w-[92px] md:w-[100px] items-center divide-x rounded-md border ring-offset-1 focus-within:ring-2 focus-within:ring-brand/50",
                          (it.quantity === 0 || isInvalid) && "border-destructive"
                        )}
                      >
                        <button
                          className="flex h-full w-7 items-center justify-center p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
                          aria-label={`Decrease quantity of ${displayName}`}
                          onClick={() =>
                            updateQuantity(it.supplierItemId, Math.max(0, it.quantity - 1))
                          }
                          disabled={it.quantity === 0}
                        >
                          <Minus className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        {isEditing ? (
                          <input
                            aria-label={`Quantity of ${displayName}`}
                            autoFocus
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={cn(
                              "h-full w-full bg-transparent text-center font-mono tabular-nums text-sm focus-visible:outline-none",
                              isInvalid && "text-destructive"
                            )}
                            value={value}
                            onChange={e =>
                              setTempQty(prev => ({
                                ...prev,
                                [it.supplierItemId]: e.target.value,
                              }))
                            }
                            onFocus={e => e.target.select()}
                            onBlur={commitEdit}
                            onKeyDown={handleInputKey}
                          />
                        ) : (
                          <span
                            aria-label={`Quantity of ${displayName}`}
                            tabIndex={0}
                            onClick={startEdit}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                startEdit()
                              }
                            }}
                            className="flex h-full flex-1 cursor-text items-center justify-center tabular-nums text-sm"
                          >
                            {it.quantity}
                          </span>
                        )}
                        <button
                          className="flex h-full w-7 items-center justify-center p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                          aria-label={`Increase quantity of ${displayName}`}
                          onClick={() =>
                            updateQuantity(it.supplierItemId, it.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4 stroke-[1.5]" />
                        </button>
                        {isInvalid && (
                          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-destructive">
                            {numericValue < MIN_QTY ? `Min ${MIN_QTY}` : `Max ${MAX_QTY}`}
                          </span>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            aria-label={`Remove ${displayName}`}
                            onClick={() => handleRemove(index)}
                            className="ml-2 flex h-7 w-7 items-center justify-center p-0 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
                          >
                            <Trash2 className="h-4 w-4 stroke-[1.5]" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Remove</TooltipContent>
                      </Tooltip>
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
