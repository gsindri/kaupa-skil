import * as React from "react"
import { createPortal } from "react-dom"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { X, Trash2 } from "lucide-react"
import { useCart } from "@/contexts/useBasket"
import { useSettings } from "@/contexts/useSettings"
import { QuantityStepper } from "./QuantityStepper"
import { cn } from "@/lib/utils"

const DESKTOP_MEDIA_QUERY = "(min-width: 769px)"

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return () => {}

    const mediaQuery = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    setMatches(mediaQuery.matches)

    return () => {
      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [query])

  return matches
}

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
    updateQuantity,
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

  const [isMounted, setIsMounted] = React.useState(false)
  const desktopRailRef = React.useRef<HTMLDivElement | null>(null)

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

  const renderItemThumb = (image: string | null, name: string) => {
    if (image) {
      return <img src={image} alt={name} className="cart-item__thumb" />
    }
    const fallback = name.trim().charAt(0).toUpperCase() || "•"
    return (
      <span aria-hidden className="cart-item__thumb cart-item__thumb--fallback">
        {fallback}
      </span>
    )
  }

  const cartItems = (
    <div className="cart-rail__body">
      {items.length === 0 ? (
        <p className="cart-rail__empty">Your cart is empty.</p>
      ) : (
        items.map(item => {
          const name = (item.displayName || item.itemName || "Item").trim() || "Item"
          const unitPrice = includeVat
            ? item.unitPriceIncVat ?? item.packPrice ?? 0
            : item.unitPriceExVat ?? item.packPrice ?? 0
          const lineTotal = unitPrice * item.quantity

          return (
            <article className="cart-item" key={item.supplierItemId}>
              {renderItemThumb(item.image, name)}
              <div className="cart-item__info">
                <div className="cart-item__title" title={name}>
                  {name}
                </div>
                <div className="cart-item__price">{formatCurrency(lineTotal)}</div>
                <div className="cart-item__actions">
                  <QuantityStepper
                    quantity={item.quantity}
                    onChange={qty =>
                      qty === 0
                        ? removeItem(item.supplierItemId)
                        : updateQuantity(item.supplierItemId, qty)
                    }
                    onRemove={() => removeItem(item.supplierItemId)}
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
            </article>
          )
        })
      )}
    </div>
  )

  const content = (
    <>
      <header className="cart-rail__header">
        <div className="cart-rail__title" aria-live="polite">
          <span>Cart</span>
          <span className="cart-rail__count">{totalItems}</span>
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

