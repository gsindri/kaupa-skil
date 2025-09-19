import * as React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import CartIcon from './CartIcon'

const MAX_SUPPLIERS_IN_PREVIEW = 5

type CartButtonVariant = 'toolbar' | 'ghost' | 'primary'

type CartButtonSize = 'default' | 'sm'

interface CartButtonProps {
  variant?: CartButtonVariant
  size?: CartButtonSize
  className?: string
  hideLabel?: boolean
  label?: string
}

interface SupplierSummary {
  id: string
  name: string
  logoUrl: string | null
  itemCount: number
  amount: number
}

export function CartButton({
  variant = 'toolbar',
  size = 'default',
  className,
  hideLabel = false,
  label = 'Cart'
}: CartButtonProps) {
  const { items, setIsDrawerOpen, isDrawerOpen } = useCart()
  const { includeVat } = useSettings()

  const { suppliers, subtotal, totalItems, missingPriceCount } = React.useMemo(() => {
    const supplierMap = new Map<string, SupplierSummary>()
    let subtotalAccumulator = 0
    let totalItemsAccumulator = 0
    let missingPrices = 0

    for (const item of items) {
      const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 0
      totalItemsAccumulator += quantity

      if (item.unitPriceIncVat == null && item.unitPriceExVat == null) {
        missingPrices += 1
      }

      const resolvedUnitPrice = includeVat ? item.unitPriceIncVat : item.unitPriceExVat
      const lineTotal = (resolvedUnitPrice ?? 0) * quantity
      subtotalAccumulator += lineTotal

      const supplierId = item.supplierId || item.supplierName || `unknown-${item.supplierItemId}`
      const supplierName = item.supplierName?.trim() || 'Unknown supplier'
      const extended = item as unknown as { supplierLogoUrl?: string | null; logoUrl?: string | null }
      const supplierLogo = extended.supplierLogoUrl ?? extended.logoUrl ?? null

      const existing = supplierMap.get(supplierId)
      if (existing) {
        existing.itemCount += quantity
        existing.amount += lineTotal
      } else {
        supplierMap.set(supplierId, {
          id: supplierId,
          name: supplierName,
          logoUrl: supplierLogo,
          itemCount: quantity,
          amount: lineTotal
        })
      }
    }

    const suppliers = Array.from(supplierMap.values()).sort((a, b) => {
      if (b.amount === a.amount) {
        return a.name.localeCompare(b.name)
      }
      return b.amount - a.amount
    })

    return {
      suppliers,
      subtotal: subtotalAccumulator,
      totalItems: totalItemsAccumulator,
      missingPriceCount: missingPrices
    }
  }, [items, includeVat])

  const displayLabel = label?.trim() || 'Cart'
  const hasItems = totalItems > 0
  const ariaLabel = `${displayLabel}, ${totalItems} item${totalItems === 1 ? '' : 's'}`
  const tooltipLabel = `${displayLabel} (C)`

  const topSuppliers = suppliers.slice(0, MAX_SUPPLIERS_IN_PREVIEW)
  const remainingSupplierCount = Math.max(0, suppliers.length - topSuppliers.length)

  const handleOpenCart = React.useCallback(() => {
    setIsDrawerOpen(true)
  }, [setIsDrawerOpen])

  const accessibilityProps = {
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': isDrawerOpen,
    'aria-controls': 'cart-drawer'
  }

  const iconSizeClass = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  const trigger = (
    <button
      type="button"
      onClick={handleOpenCart}
      className={cn(
        'group inline-flex min-h-[38px] items-end rounded-none border-0 bg-transparent p-0 text-sm font-medium leading-tight text-[inherit] transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
        variant === 'toolbar' && 'text-[color:var(--ink-dim,#cfd7e4)] hover:text-white',
        variant === 'ghost' && 'text-foreground hover:text-foreground/80',
        variant === 'primary' && 'text-primary hover:text-primary/80',
        size === 'sm' ? 'gap-[3px]' : 'gap-[4px]',
        size === 'sm' ? 'text-sm' : 'text-base',
        className
      )}
      aria-label={ariaLabel}
      title={tooltipLabel}
      aria-keyshortcuts="c"
      {...accessibilityProps}
    >
      <span className="relative inline-flex items-center justify-center pb-px">
        <CartIcon
          count={totalItems}
          className={cn('shrink-0 text-current', iconSizeClass)}
          title={`${displayLabel} (${totalItems})`}
        />
      </span>
      {!hideLabel && (
        <span
          className={cn(
            'font-medium leading-none tracking-tight transition-colors duration-150 ease-out',
            size === 'sm' ? 'text-sm' : 'text-[0.95rem]',
            'translate-y-[2px]'
          )}
        >
          {displayLabel}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {hasItems ? `${totalItems} item${totalItems === 1 ? '' : 's'} in cart` : 'Cart is empty'}
      </span>
    </button>
  )

  return (
    <HoverCard openDelay={150} closeDelay={150}>
      <HoverCardTrigger asChild>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent align="end" sideOffset={12} className="w-80 p-4">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subtotal</div>
              <div className="text-lg font-semibold leading-tight">{formatCurrency(subtotal)}</div>
              <div className="text-xs text-muted-foreground">
                {totalItems === 1 ? '1 item' : `${totalItems} items`} · Prices {includeVat ? 'incl. VAT' : 'excl. VAT'}
              </div>
            </div>
            {missingPriceCount > 0 ? (
              <div className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                {missingPriceCount} price{missingPriceCount === 1 ? '' : 's'} missing
              </div>
            ) : null}
          </div>

          {hasItems ? (
            <div className="rounded-lg border bg-background/80 shadow-sm">
              <ul className="divide-y divide-border/60">
                {topSuppliers.map(supplier => (
                  <li key={supplier.id} className="flex items-center gap-3 px-3 py-2">
                    <LogoOrInitial name={supplier.name} logoUrl={supplier.logoUrl || undefined} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {supplier.itemCount} item{supplier.itemCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="text-sm font-medium tabular-nums">{formatCurrency(supplier.amount)}</div>
                  </li>
                ))}
              </ul>
              {remainingSupplierCount > 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  +{remainingSupplierCount} more supplier{remainingSupplierCount === 1 ? '' : 's'}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          )}

          <div className="flex justify-end">
            <Button size="sm" variant="secondary" onClick={handleOpenCart} className="px-3">
              View cart
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function LogoOrInitial({ name, logoUrl }: { name: string; logoUrl?: string }) {
  const initial = (name?.trim()?.[0] || '?').toUpperCase()
  return logoUrl ? (
    <img
      src={logoUrl}
      alt=""
      width={20}
      height={20}
      className="size-5 rounded-sm object-contain bg-white"
      loading="lazy"
    />
  ) : (
    <div className="size-5 rounded-sm bg-muted grid place-items-center text-[10px] font-bold text-muted-foreground">
      {initial}
    </div>
  )
}

export default CartButton
