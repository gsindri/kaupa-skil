import * as React from "react"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Pin, PinOff, ShoppingCart, Trash2, X } from "lucide-react"
import { useCart } from "@/contexts/useBasket"
import { useSettings } from "@/contexts/useSettings"
import { QuantityStepper } from "./QuantityStepper"
import { cn } from "@/lib/utils"

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getMissingPriceCount,
    isDrawerOpen,
    setIsDrawerOpen,
    isDrawerPinned,
    setIsDrawerPinned,
  } = useCart()
  const { includeVat, setIncludeVat } = useSettings()

  const subtotal = getTotalPrice(includeVat)
  const missingPriceCount = getMissingPriceCount()
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "ISK",
      maximumFractionDigits: 0,
    }).format(n || 0)

  const togglePinned = React.useCallback(() => {
    setIsDrawerPinned(prev => !prev)
  }, [setIsDrawerPinned])

  const pinLabel = isDrawerPinned ? "Unpin cart sidebar" : "Pin cart sidebar"

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen} modal={false}>
      <SheetContent
        side="right"
        hideOverlay
        data-pinned={isDrawerPinned ? "true" : undefined}
        className={cn(
          isDrawerPinned && "shadow-none"
        )}
        onPointerDownOutside={event => event.preventDefault()}
        onInteractOutside={event => event.preventDefault()}
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        <div className="sticky top-0 z-10 border-b border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/95 backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                aria-label={pinLabel}
                aria-pressed={isDrawerPinned}
                title={pinLabel}
                className={cn(
                  "h-8 w-8 text-[color:var(--text-muted)] hover:text-[color:var(--text)]",
                  isDrawerPinned && "text-[color:var(--brand-accent,#f59e0b)]"
                )}
                onClick={togglePinned}
              >
                {isDrawerPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setIsDrawerOpen(false)
                  location.assign("/orders")
                }}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Go to cart</span>
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close cart" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
            {items.length === 0 && (
              <div className="rounded-xl border border-dashed border-[color:var(--surface-ring)] px-3 py-6 text-center text-xs text-[color:var(--text-muted)]">
                Your cart is empty.
              </div>
            )}

            {items.map(it => (
              <div
                key={it.supplierItemId}
                className="flex flex-col items-center gap-2 rounded-xl border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]/60 px-1.5 py-3 text-center"
              >

                <div className="flex w-full flex-col items-center gap-1">
                  <div className="line-clamp-2 text-[13px] font-semibold leading-tight">
                    {it.displayName || it.itemName}
                  </div>
                  {it.packSize ? (
                    <div className="text-[10px] text-[color:var(--text-muted)]">{it.packSize}</div>
                  ) : null}
                  {it.supplierName ? (
                    <div className="text-[10px] text-[color:var(--text-muted)]">{it.supplierName}</div>
                  ) : null}

                  <div className="mt-1 text-sm font-semibold">
                    {formatCurrency(
                      includeVat
                        ? it.unitPriceIncVat ?? it.packPrice ?? 0
                        : it.unitPriceExVat ?? it.packPrice ?? 0,
                    )}
                  </div>

                  <QuantityStepper
                    quantity={it.quantity}
                    onChange={qty =>
                      qty === 0
                        ? removeItem(it.supplierItemId)
                        : updateQuantity(it.supplierItemId, qty)
                    }
                    label={it.displayName || it.itemName}
                    className="mx-auto min-w-[96px]"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${it.displayName || "item"}`}
                    className="mt-2 h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => removeItem(it.supplierItemId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-10 border-t border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <Button
                variant={!includeVat ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVat(false)}
              >
                Ex VAT
              </Button>
              <Button
                variant={includeVat ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeVat(true)}
              >
                Inc VAT
              </Button>
            </div>
            <Button size="lg" className="min-w-[140px]" onClick={() => location.assign("/checkout")}>
              Checkout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default CartDrawer

