import React, { useRef, useEffect } from 'react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import VatToggle from '@/components/ui/VatToggle'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { Link } from 'react-router-dom'
import type { CartItem } from '@/lib/types'
import { getCachedImageUrl } from '@/services/ImageCache'
import { PLACEHOLDER_IMAGE } from '@/lib/images'
import { cn } from '@/lib/utils'
import { QuantityStepper } from './QuantityStepper'
import { formatPrice } from '@/lib/formatPrice'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface CartItemRowProps {
  item: CartItem
  includeVat: boolean
  updateQuantity: (supplierItemId: string, quantity: number) => void
  removeItem: (supplierItemId: string) => void
}

function CartItemRow({ item, includeVat, updateQuantity, removeItem }: CartItemRowProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === '+') {
        updateQuantity(item.supplierItemId, item.quantity + 1)
      } else if (e.key === '-') {
        updateQuantity(item.supplierItemId, Math.max(0, item.quantity - 1))
      } else if (/^[1-9]$/.test(e.key)) {
        updateQuantity(item.supplierItemId, Number(e.key))
      }
    }

    const addListener = () => window.addEventListener('keydown', handleKeyDown)
    const removeListener = () => window.removeEventListener('keydown', handleKeyDown)

    card.addEventListener('mouseenter', addListener)
    card.addEventListener('mouseleave', removeListener)
    card.addEventListener('focus', addListener)
    card.addEventListener('blur', removeListener)

    return () => {
      removeListener()
      card.removeEventListener('mouseenter', addListener)
      card.removeEventListener('mouseleave', removeListener)
      card.removeEventListener('focus', addListener)
      card.removeEventListener('blur', removeListener)
    }
  }, [item.supplierItemId, item.quantity, updateQuantity])

  const displayName = item.itemName || item.displayName
  const unitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
  const lineTotal = unitPrice != null ? unitPrice * item.quantity : null

  return (
    <div
      ref={cardRef}
      className={cn(
        "grid items-center gap-3 grid-cols-[44px,minmax(0,1fr),112px] md:grid-cols-[56px,minmax(0,1fr),128px] px-2 py-2 rounded-lg hover:bg-muted/50 focus-within:ring-2 focus-within:ring-primary/30",
        item.quantity === 0 && "bg-red-50 text-red-700"
      )}
    >
      <img
        src={getCachedImageUrl(item.image) || PLACEHOLDER_IMAGE}
        alt=""
        className="h-10 w-10 md:h-12 md:w-12 rounded object-cover bg-muted/40"
      />
      <div className="min-w-0 pr-6 md:pr-8">
        <p
          className="text-sm md:text-base font-medium leading-tight line-clamp-2"
          title={displayName}
        >
          {displayName}
        </p>
        <div className="mt-[-2px] flex items-baseline justify-between text-xs text-muted-foreground">
          <span className="flex-1 truncate">{item.packSize}</span>
          {lineTotal == null ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-2 tabular-nums whitespace-nowrap">kr —</span>
              </TooltipTrigger>
              <TooltipContent>
                {`Connect ${item.supplierName} to see price.`}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span className="ml-2 tabular-nums whitespace-nowrap">
              {formatPrice(lineTotal)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center">
        <QuantityStepper
          quantity={item.quantity}
          onChange={qty => updateQuantity(item.supplierItemId, qty)}
          label={displayName}
        />
        <button
          aria-label="Remove item"
          className="ml-2 flex h-7 w-7 items-center justify-center p-0 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1"
          onClick={() => removeItem(item.supplierItemId)}
          title="Remove"
        >
          <Trash2 className="h-4 w-4 stroke-[1.5]" />
        </button>
      </div>
    </div>
  )
}

export function CartDrawer() {
  const {
    items,
    getTotalItems,
    isDrawerOpen,
    setIsDrawerOpen,
    clearCart,
    restoreItems,
    updateQuantity,
    removeItem,
  } = useCart()
  const { includeVat, setIncludeVat } = useSettings()
  const lastItems = useRef(items)

  const totalExVat = items.reduce(
    (sum, item) => sum + item.unitPriceExVat * item.quantity,
    0,
  )
  const totalIncVat = items.reduce(
    (sum, item) => sum + item.unitPriceIncVat * item.quantity,
    0,
  )
  const vatAmount = totalIncVat - totalExVat

  const handleClearCart = () => {
    if (items.length === 0) return
    lastItems.current = items.map(item => ({ ...item }))
    clearCart()
    toast({
      title: 'Cart cleared',
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => restoreItems(lastItems.current)}
        >
          Undo
        </ToastAction>
      ),
      duration: 7000,
    })
  }

  const groups = items.reduce(
    (acc, it) => {
      ;(acc[it.supplierId] ||= { supplierName: it.supplierName, items: [] }).items.push(it)
      return acc
    },
    {} as Record<string, { supplierName: string; items: CartItem[] }>,
  )

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerContent
        side="right"
        showBar={false}
        role="dialog"
        aria-modal="true"
        className="max-w-[480px] md:max-w-[45vw] rounded-none z-[60]"
        style={{ width: 'min(90vw, 480px)' }}
      >
        <div className="flex h-full flex-col rounded-xl border shadow-md overflow-hidden bg-background">
          <DrawerHeader className="grid grid-cols-[1fr_auto] gap-y-2 px-5 py-5 md:px-6 md:py-6 relative">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <DrawerTitle className="text-lg font-semibold">
                Your Cart
              </DrawerTitle>
            </div>
            <VatToggle
              includeVat={includeVat}
              onToggle={setIncludeVat}
              size="sm"
            />

            <div
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              {getTotalItems()} items
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="link"
                  size="sm"
                  className="justify-self-end text-sm text-muted-foreground items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1 stroke-[1.5]" />
                  Clear Cart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all items from your cart.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearCart}>
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Close button removed as requested */}
          </DrawerHeader>
          <Separator className="opacity-10" />

          <div className="flex-1 max-h-[60vh] overflow-auto px-2 py-2 pr-3 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
                <ShoppingCart
                  className="h-16 w-16 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="text-sm text-muted-foreground">
                  Your cart is empty.
                </p>
                <Button asChild>
                  <Link
                    to="/catalog"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Browse Catalog
                  </Link>
                </Button>
              </div>
            ) : (
              Object.values(groups).map(group => (
                <section key={group.supplierName} className="mb-4">
                  <header className="sticky top-0 z-10 bg-muted/40 px-3 py-1.5 border-b">
                    <span className="text-sm font-semibold">{group.supplierName}</span>
                  </header>
                  <div className="divide-y">
                    {group.items.map(item => (
                      <CartItemRow
                        key={item.supplierItemId}
                        item={item}
                        includeVat={includeVat}
                        updateQuantity={updateQuantity}
                        removeItem={removeItem}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="sticky bottom-0 border-t bg-background px-3 py-3 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(totalExVat)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT</span>
                  <span className="font-mono">{formatPrice(vatAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="font-mono">
                    {formatPrice(includeVat ? totalIncVat : totalExVat)}
                  </span>
                </div>
              </div>
              <Button className="w-full h-11 rounded-xl text-base">Checkout</Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

