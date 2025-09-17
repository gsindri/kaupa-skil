import * as React from 'react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { useSettings } from '@/contexts/useSettings'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { CartSoft } from '@/components/icons-soft'
import { IconButton } from '@/components/ui/IconButton'

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

  const clampedCount = clampCount(totalItems)
  const countLabel = clampedCount > 0 ? clampedLabel(clampedCount) : null
  const hasItems = totalItems > 0
  const ariaLabel = hasItems
    ? `${label} with ${totalItems} ${totalItems === 1 ? 'item' : 'items'} totaling ${formatCurrency(subtotal)}`
    : `${label} is empty`
  const tooltipLabel = 'Cart (C)'

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

  const iconTone = hasItems ? 0.18 : 0.12
  const toolbarTone = hasItems ? 1 : iconTone
  const iconSize = size === 'sm' ? 20 : 22
  const toolbarIcon = (
    <CartSoft
      width={hasItems ? 22 : 24}
      height={hasItems ? 22 : 24}
      tone={toolbarTone}
      className={cn('shrink-0', hasItems ? 'text-white' : undefined)}
    />
  )

  const standardIcon = (
    <CartSoft width={iconSize} height={iconSize} tone={iconTone} className="shrink-0" />
  )

  const trigger =
    variant === 'toolbar' && !hasItems ? (
      <IconButton
        label={label}
        aria-label={ariaLabel}
        onClick={handleOpenCart}
        title={tooltipLabel}
        aria-keyshortcuts="c"
        className={cn('text-[color:var(--ink-dim,#cfd7e4)]', className)}
        {...accessibilityProps}
      >
        {toolbarIcon}
      </IconButton>
    ) : (
      <button
        type="button"
        onClick={handleOpenCart}
        className={cn(
          'relative inline-flex items-center gap-2 font-semibold leading-tight ui-numeric transition-[background-color,color,transform,box-shadow] duration-fast ease-snap motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent motion-safe:hover:-translate-y-[0.5px] motion-reduce:hover:translate-y-0',
          variant === 'toolbar'
            ? cn(
                'h-[var(--chip-h,2.5rem)] rounded-full px-3 shadow-sm ring-1 ring-white/10 hover:ring-white/20',
                hasItems
                  ? 'bg-[linear-gradient(135deg,#3473ff,#2cc6ff)] text-white hover:bg-[linear-gradient(135deg,#3c7dff,#39d4ff)]'
                  : 'bg-white/5 text-white/90 hover:bg-white/8'
              )
            : size === 'sm'
            ? 'h-9 px-3 text-sm rounded-xl'
            : 'h-10 px-3.5 text-sm rounded-2xl',
          variant === 'primary' &&
            'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
          variant === 'ghost' &&
            'bg-transparent hover:bg-muted/70 text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2',
          className
        )}
        aria-label={ariaLabel}
        title={tooltipLabel}
        aria-keyshortcuts="c"
        {...accessibilityProps}
      >
        {variant === 'toolbar' ? toolbarIcon : standardIcon}
        {!hideLabel && <span>{label}</span>}
        {countLabel ? (
          <span
            aria-live="polite"
            className={cn(
              variant === 'toolbar'
                ? 'grid h-5 min-w-5 place-items-center rounded-full bg-black/20 px-1 text-xs font-medium text-white translate-y-[1px]'
                : 'ml-2 inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold leading-none',
              variant === 'toolbar' && !hideLabel ? 'ml-1' : null,
              variant === 'primary' && 'bg-primary-foreground/15 text-primary-foreground',
              variant === 'ghost' && 'bg-foreground/10 text-foreground'
            )}
          >
            {countLabel}
          </span>
        ) : null}
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

function clampCount(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(Math.floor(n), 999)
}

function clampedLabel(n: number): string {
  return n > 99 ? '99+' : String(n)
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
