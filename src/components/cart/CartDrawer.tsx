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
import { QuantityControls } from '@/components/quick/QuantityControls'
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
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { Link } from 'react-router-dom'
import { lockScroll, unlockScroll } from '@/lib/lockScroll'

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

  useEffect(() => {
    if (isDrawerOpen) {
        lockScroll()
    } else {
        unlockScroll()
    }
  }, [isDrawerOpen])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

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

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerContent
        showBar={false}
        role="dialog"
        aria-modal="true"
        className="left-auto right-0 top-0 mt-0 bottom-0 h-full w-full max-w-[400px] md:max-w-[35vw] rounded-none border-l z-[60]"
        style={{ width: 'min(35vw, 380px)' }}
      >
        <div className="flex h-full flex-col">
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
                  className="justify-self-end text-sm text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
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

          <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5 md:py-6 space-y-6">
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
                    to="/quick-order"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Place Order
                  </Link>
                </Button>
              </div>
            ) : (
              items.map(item => (
                <div
                  key={item.supplierItemId}
                  className="flex items-center gap-4 group"
                >
                  <div
                    className="h-12 w-12 rounded bg-muted flex-shrink-0"
                    aria-hidden="true"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className="truncate text-sm font-medium"
                        title={item.itemName}
                      >
                        {item.itemName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {item.supplierName}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.packSize}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <QuantityControls
                      quantity={item.quantity}
                      onQuantityChange={qty =>
                        updateQuantity(item.supplierItemId, qty)
                      }
                      onAdd={() =>
                        updateQuantity(
                          item.supplierItemId,
                          item.quantity + 1,
                        )
                      }
                      onRemove={() =>
                        updateQuantity(
                          item.supplierItemId,
                          item.quantity - 1,
                        )
                      }
                    />
                    <div className="w-20 text-right text-sm font-medium font-mono">
                      {formatPrice(
                        (includeVat
                          ? item.unitPriceIncVat
                          : item.unitPriceExVat) * item.quantity,
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeItem(item.supplierItemId)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t px-5 md:px-6 py-5 md:py-6 space-y-4 sticky bottom-0 bg-background">
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
              <Button className="w-full">Checkout</Button>
              <Button variant="link" className="w-full justify-center" asChild>
                <Link to="/cart">View cart</Link>
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

