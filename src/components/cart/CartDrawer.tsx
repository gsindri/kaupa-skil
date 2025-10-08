import * as React from "react"
import { createPortal } from "react-dom"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingCart, X, Trash2 } from "lucide-react"
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

  const [isMounted, setIsMounted] = React.useState(false)
  const desktopRailRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const subtotal = getTotalPrice(includeVat)

  const handleClose = React.useCallback(() => {
    setIsDrawerOpen(false)
  }, [setIsDrawerOpen])

  const handleCheckout = React.useCallback(() => {
    window.location.assign("/checkout")
  }, [])

  React.useEffect(() => {
    if (!isDesktop) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!isDrawerOpen) return
      const target = event.target as Node | null
      if (!target) return
      if (desktopRailRef.current && desktopRailRef.current.contains(target)) {
        return
      }
      handleClose()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [isDesktop, isDrawerOpen, handleClose])

  const cartItems = (
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

  const desktopRail =
    isMounted && isDesktop
      ? createPortal(
          <div
            className="cart-rail__layer"
            data-state={isDrawerOpen ? "open" : "closed"}
            aria-hidden={isDrawerOpen ? undefined : true}
          >
            <aside
              ref={desktopRailRef}
              className="cart-rail cart-rail--desktop"
              aria-label="Cart"
              role="region"
              aria-labelledby="cart-rail-title"
              data-state={isDrawerOpen ? "open" : "closed"}
            >
              {content}
            </aside>
          </div>,
          document.body
        )
      : null

  return (
    <>
      {desktopRail}

      {!isDesktop && (
        <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <SheetContent
            side="right"
            className={cn("cart-rail cart-rail--mobile p-0")}
            aria-label="Cart"
          >
            {content}
          </SheetContent>
        </Sheet>
      )}
    </>
  )
}

export default CartDrawer

