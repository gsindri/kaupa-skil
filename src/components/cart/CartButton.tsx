import * as React from 'react'
import { useCart } from '@/contexts/useBasket'
import { cn } from '@/lib/utils'
import CartIcon from './CartIcon'

type CartButtonVariant = 'toolbar' | 'ghost' | 'primary'

type CartButtonSize = 'default' | 'sm'

interface CartButtonProps {
  variant?: CartButtonVariant
  size?: CartButtonSize
  className?: string
  hideLabel?: boolean
  label?: string
}

export function CartButton({
  variant = 'toolbar',
  size = 'default',
  className,
  hideLabel = false,
  label = 'Cart'
}: CartButtonProps) {
  const { items, setIsDrawerOpen, isDrawerOpen, cartPulseSignal } = useCart()

  const totalItems = React.useMemo(() => {
    return items.reduce((accumulator, item) => {
      const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 0
      return accumulator + quantity
    }, 0)
  }, [items])

  const displayLabel = label?.trim() || 'Cart'
  const hasItems = totalItems > 0
  const ariaLabel = `${displayLabel}, ${totalItems} item${totalItems === 1 ? '' : 's'}`
  const tooltipLabel = `${displayLabel} (C)`

  const [isPulsing, setIsPulsing] = React.useState(false)

  React.useEffect(() => {
    if (!cartPulseSignal) return
    if (isDrawerOpen) {
      setIsPulsing(false)
      return
    }

    setIsPulsing(true)
    const timeout = window.setTimeout(() => setIsPulsing(false), 900)
    return () => window.clearTimeout(timeout)
  }, [cartPulseSignal, isDrawerOpen])

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
      <span
        className={cn(
          'relative inline-flex items-center justify-center pb-px transition-transform duration-200 ease-out',
          isPulsing && 'cart-button-pulse'
        )}
      >
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

  return trigger
}

export default CartButton
