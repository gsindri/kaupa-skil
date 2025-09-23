import * as React from "react"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Pin, PinOff, Trash2, X } from "lucide-react"
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
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        side="right"
        hideOverlay={isDrawerPinned}
        data-pinned={isDrawerPinned ? "true" : undefined}
        className={cn(
          "w-[360px] md:w-[420px] max-w-[100vw] flex flex-col p-0 text-[color:var(--text)] [&>button:last-child]:hidden",
          isDrawerPinned && "shadow-none"
        )}
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        <div className="sticky top-0 z-10 border-b border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/95 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="text-sm leading-tight text-[color:var(--text-muted)]">
              <span aria-live="polite" className="sr-only">
                Cart subtotal {formatCurrency(subtotal)}
              </span>
              <div className="text-[12px] uppercase tracking-[0.08em]">Subtotal</div>
              <div className="text-base font-semibold text-[color:var(--text)]">{formatCurrency(subtotal)}</div>
            </div>
            <div className="flex items-center gap-2">
              {missingPriceCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Some prices unavailable
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={pinLabel}
                aria-pressed={isDrawerPinned}
                title={pinLabel}
                className={cn(
                  "text-[color:var(--text-muted)] hover:text-[color:var(--text)]",
                  isDrawerPinned && "text-[color:var(--brand-accent,#f59e0b)]"
                )}
                onClick={togglePinned}
              >
                {isDrawerPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false)
                  location.assign("/orders")
                }}
              >
                Go to Cart
              </Button>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close cart">
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-3 px-4 py-4">
            {items.length === 0 && (
              <div className="p-6 text-center text-sm text-[color:var(--text-muted)]">
                Your cart is empty.
              </div>
            )}

            {items.map(it => (
              <div
                key={it.supplierItemId}
                className="rounded-xl border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)]/60 p-3"
              >
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[color:var(--surface-pop-2)]/40">
                    {it.image ? (
                      <img src={it.image} alt="" className="h-full w-full object-contain" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">{it.displayName || it.itemName}</div>
                    {it.packSize ? (
                      <div className="text-xs text-[color:var(--text-muted)]">{it.packSize}</div>
                    ) : null}
                    {it.supplierName ? (
                      <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">{it.supplierName}</div>
                    ) : null}

                    <div className="mt-3 text-sm font-semibold">
                      {formatCurrency(
                        includeVat
                          ? it.unitPriceIncVat ?? it.packPrice ?? 0
                          : it.unitPriceExVat ?? it.packPrice ?? 0,
                      )}
                    </div>

                    <div className="mt-3 inline-flex items-center gap-2">
                      <QuantityStepper
                        quantity={it.quantity}
                        onChange={qty =>
                          qty === 0
                            ? removeItem(it.supplierItemId)
                            : updateQuantity(it.supplierItemId, qty)
                        }
                        label={it.displayName || it.itemName}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${it.displayName || "item"}`}
                        className="ml-1 text-destructive hover:text-destructive"
                        onClick={() => removeItem(it.supplierItemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="sticky bottom-0 z-10 border-t border-[color:var(--surface-ring)] bg-[color:var(--surface-pop-2)]/95 backdrop-blur">
          <div className="flex items-center justify-between px-5 py-4">
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

