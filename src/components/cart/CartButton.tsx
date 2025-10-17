import * as React from 'react'
import { useTranslation } from '@/lib/i18n'
import { useCart } from '@/contexts/useBasket'
import { cn } from '@/lib/utils'
import { CART_ROUTE } from '@/lib/featureFlags'
import {
  navTextButtonClass,
  navTextButtonFocusRingClass,
  navTextButtonPillClass,
} from '@/components/layout/navStyles'
import CartIcon from './CartIcon'

type CartButtonVariant = 'toolbar' | 'ghost' | 'primary'

type CartButtonSize = 'default' | 'sm'

interface CartButtonProps {
  variant?: CartButtonVariant
  size?: CartButtonSize
  className?: string
  hideLabel?: boolean
  label?: string
  labelClassName?: string
}

export function CartButton({
  variant = 'toolbar',
  size = 'default',
  className,
  hideLabel = false,
  label,
  labelClassName
}: CartButtonProps) {
  const { items, isDrawerOpen, cartPulseSignal } = useCart()
  const { t } = useTranslation(undefined, { keyPrefix: 'cart.button' })

  const totalItems = React.useMemo(() => {
    return items.reduce((accumulator, item) => {
      const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? Math.floor(item.quantity) : 0
      return accumulator + quantity
    }, 0)
  }, [items])

  const displayLabel = label?.trim() || t('label')
  const hasItems = totalItems > 0
  const ariaLabel = hasItems
    ? t('ariaLabel.withItems', { label: displayLabel, count: totalItems })
    : t('ariaLabel.empty', { label: displayLabel, count: totalItems })
  const tooltipLabel = t('tooltip', { label: displayLabel })

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
    window.location.assign(CART_ROUTE)
  }, [])

  const isToolbarVariant = variant === 'toolbar'

  const buttonClassName = cn(
    'max-w-full overflow-hidden',
    isToolbarVariant
      ? [
          navTextButtonClass,
          'text-left',
          'text-[color:var(--ink-dim,#cfd7e4)] hover:text-[color:var(--ink,#eaf0f7)] focus-visible:text-[color:var(--ink,#eaf0f7)]',
        ]
      : [
          'group inline-flex min-h-[38px] items-center rounded-none border-0 bg-transparent p-0 text-sm font-medium leading-tight text-[inherit] transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          size === 'sm' ? 'gap-[3px]' : 'gap-[4px]',
          size === 'sm' ? 'text-sm' : 'text-base',
          variant === 'ghost' && 'text-foreground hover:text-foreground/80',
          variant === 'primary' && 'text-primary hover:text-primary/80',
          variant === 'toolbar' && 'text-[color:var(--ink-dim,#cfd7e4)] hover:text-white',
        ],
    className
  )

  const iconWrapperClass = cn(
    'relative inline-flex items-center justify-center rounded-full transition-colors duration-200 ease-out',
    isToolbarVariant
      ? [
          'size-11 min-w-[44px] rounded-full bg-white/5',
          'group-hover:bg-white/10 group-focus-visible:bg-white/10',
        ]
      : [size === 'sm' ? 'h-9 w-9' : 'h-10 w-10'],
    isPulsing && 'cart-button-pulse'
  )

  const iconClassName = cn(
    'shrink-0 text-current',
    isToolbarVariant ? 'h-6 w-6' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  )

  return (
    <button
      type="button"
      onClick={handleOpenCart}
      className={buttonClassName}
      aria-label={ariaLabel}
      title={tooltipLabel}
    >
      {isToolbarVariant ? <span className={navTextButtonPillClass} aria-hidden="true" /> : null}
      <span className={iconWrapperClass}>
        <CartIcon
          count={totalItems}
          className={iconClassName}
          title={t('iconTitle', { label: displayLabel, count: totalItems })}
        />
      </span>
      {!hideLabel && (
        <span
          className={cn(
            'min-w-0 truncate font-medium leading-tight tracking-tight transition-colors duration-150 ease-out',
            isToolbarVariant ? 'text-[inherit]' : size === 'sm' ? 'text-sm' : 'text-[0.95rem]',
            labelClassName
          )}
        >
          {displayLabel}
        </span>
      )}
      {isToolbarVariant ? <span className={navTextButtonFocusRingClass} aria-hidden="true" /> : null}
      <span className="sr-only" aria-live="polite">
        {hasItems
          ? t('status.withItems', { count: totalItems })
          : t('status.empty')}
      </span>
    </button>
  )
}

export default CartButton
