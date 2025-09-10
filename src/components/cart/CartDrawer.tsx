import * as React from "react"
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Trash2, X } from "lucide-react"
import { useCart } from "@/contexts/useBasket"
import { useSettings } from "@/contexts/useSettings"
import { QuantityStepper } from "./QuantityStepper"

export function CartDrawer() {
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalPrice,
    getMissingPriceCount,
    isDrawerOpen,
    setIsDrawerOpen,
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

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        side="right"
        className="w-[380px] max-w-[92vw] p-0 flex flex-col [&>button:last-child]:hidden"
        aria-label="Shopping cart"
        id="cart-drawer"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="text-sm leading-tight">
              <span aria-live="polite" className="sr-only">
                Cart subtotal {formatCurrency(subtotal)}
              </span>
              <div className="text-muted-foreground">Subtotal</div>
              <div className="font-semibold text-base">{formatCurrency(subtotal)}</div>
            </div>
            <div className="flex items-center gap-2">
              {missingPriceCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Some prices unavailable
                </Badge>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDrawerOpen(false)
                  location.assign("/cart")
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
          <div className="px-3 py-2 space-y-3">
            {items.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Your cart is empty.
              </div>
            )}

            {items.map(it => (
              <div key={it.supplierItemId} className="rounded-lg border p-3">
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {it.image ? (
                      <img src={it.image} alt="" className="h-full w-full object-contain" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.displayName || it.itemName}</div>
                    {it.packSize ? (
                      <div className="text-xs text-muted-foreground">{it.packSize}</div>
                    ) : null}
                    {it.supplierName ? (
                      <div className="mt-0.5 text-xs text-muted-foreground">{it.supplierName}</div>
                    ) : null}

                    <div className="mt-2 text-sm font-semibold">
                      {formatCurrency(
                        includeVat
                          ? it.unitPriceIncVat ?? it.packPrice ?? 0
                          : it.unitPriceExVat ?? it.packPrice ?? 0,
                      )}
                    </div>

                    <div className="mt-2 inline-flex items-center gap-2">
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

        <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur">
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

