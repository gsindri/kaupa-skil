import * as React from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X, Trash2, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/useBasket"
import { useSettings } from "@/contexts/useSettings"
import { QuantityStepper } from "./QuantityStepper"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/useMediaQuery"

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)"

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "ISK",
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export function CartDrawer() {
  const {
    items,
    removeItem,
    getTotalPrice,
    isDrawerOpen,
    setIsDrawerOpen,
    isHydrating,
  } = useCart()
  const { includeVat } = useSettings()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)

  const totalItems = React.useMemo(() => {
    return items.reduce((accumulator, item) => {
      const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 0
      return accumulator + quantity
    }, 0)
  }, [items])

  const totalLabel = React.useMemo(() => {
    const suffix = totalItems === 1 ? "item" : "items"
    return `${totalItems} ${suffix}`
  }, [totalItems])

  const subtotal = getTotalPrice(includeVat)

  const handleClose = React.useCallback(() => {
    setIsDrawerOpen(false)
  }, [setIsDrawerOpen])

  const handleCheckout = React.useCallback(() => {
    window.location.assign("/checkout")
  }, [])

  const cartItems = isHydrating ? (
    <div className="cart-rail__body">
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading your cart...</p>
      </div>
    </div>
  ) : (
    <div className="cart-rail__body">
      {items.length === 0 ? (
        <div className="cart-rail__empty-state" role="status">
          <span className="cart-rail__empty-icon" aria-hidden>
            <ShoppingCart />
          </span>
          <p className="cart-rail__empty-title">Your cart is empty</p>
          <p className="cart-rail__empty-copy">
            Add items from the catalog to start building your order.
          </p>
        </div>
      ) : (
        <ul className="cart-rail__list">
          {items.map(item => {
            const name = (item.displayName || item.itemName || "Item").trim() || "Item"
            const unitPrice = includeVat
              ? item.unitPriceIncVat ?? item.packPrice ?? 0
              : item.unitPriceExVat ?? item.packPrice ?? 0
            const lineTotal = unitPrice * item.quantity
            const unitPriceLabel = formatCurrency(unitPrice)

            const renderItemThumb = () => {
              if (item.image) {
                return (
                  <img
                    src={item.image}
                    alt={name}
                    className="cart-item__thumb"
                    loading="lazy"
                  />
                )
              }

              const fallback = name.trim().charAt(0).toUpperCase() || "•"
              return (
                <span aria-hidden className="cart-item__thumb cart-item__thumb--fallback">
                  {fallback}
                </span>
              )
            }

            return (
              <li className="cart-item" key={item.supplierItemId}>
                <div className="cart-item__media">{renderItemThumb()}</div>
                <div className="cart-item__meta">
                  <div className="cart-item__topline">
                    <span className="cart-item__title" title={name}>
                      {name}
                    </span>
                    <span className="cart-item__line-total">{formatCurrency(lineTotal)}</span>
                  </div>
                  {item.supplierName ? (
                    <p className="cart-item__supplier">{item.supplierName}</p>
                  ) : null}
                  <p className="cart-item__unit-price">Unit price · {unitPriceLabel}</p>
                  <div className="cart-item__controls">
                    <QuantityStepper
                      supplierItemId={item.supplierItemId}
                      quantity={item.quantity}
                      label={name}
                      supplier={item.supplierName}
                      className="cart-item__stepper"
                    />
                    <button
                      type="button"
                      className="cart-item__remove"
                      aria-label={`Remove ${name}`}
                      onClick={() => removeItem(item.supplierItemId)}
                    >
                      <Trash2 aria-hidden className="cart-item__remove-icon" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  const content = (
    <>
      <header className="cart-rail__header">
        <div className="cart-rail__title" aria-live="polite">
          <span className="cart-rail__title-text">Cart</span>
          <span className="cart-rail__count">{totalLabel}</span>
        </div>
        <button
          type="button"
          className="cart-rail__close"
          aria-label="Close cart"
          onClick={handleClose}
        >
          <X aria-hidden className="cart-rail__close-icon" />
        </button>
      </header>
      {cartItems}
      <footer className="cart-rail__footer">
        <div className="cart-rail__summary">
          <span>Subtotal</span>
          <span className="cart-rail__subtotal">{formatCurrency(subtotal)}</span>
        </div>
        <Button
          type="button"
          className="cart-rail__checkout"
          onClick={handleCheckout}
        >
          Checkout
        </Button>
      </footer>
    </>
  )

  if (isDesktop) {
    return (
      <aside
        className={cn(
          'cart-rail cart-rail--desktop',
          'transition-[width,opacity] duration-[var(--cart-rail-transition,240ms)]',
          'motion-reduce:transition-none',
          isDrawerOpen ? 'cart-rail--open' : 'cart-rail--closed'
        )}
        style={{
          position: 'sticky',
          top: 'var(--header-h, 56px)',
          right: 0,
          height: 'calc(100vh - var(--header-h, 56px))',
          width: isDrawerOpen ? 'var(--cart-rail-w, 240px)' : '0px',
          opacity: isDrawerOpen ? 1 : 0,
          pointerEvents: isDrawerOpen ? 'auto' : 'none',
          overflow: 'hidden',
        }}
        aria-label="Cart"
        role="region"
        aria-hidden={!isDrawerOpen}
      >
        {content}
      </aside>
    )
  }

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <SheetContent
        side="right"
        className={cn("cart-rail cart-rail--mobile p-0")}
        aria-label="Cart"
      >
        {content}
      </SheetContent>
    </Sheet>
  )
}

export default CartDrawer

