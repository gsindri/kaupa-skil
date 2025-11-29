import * as React from 'react'

import { cn } from '@/lib/utils'

export type CartIconProps = {
  count?: number
  title?: string
  className?: string
} & Omit<React.HTMLAttributes<HTMLSpanElement>, 'title' | 'children'>

export default function CartIcon({
  count,
  title = 'Cart',
  className,
  ...rest
}: CartIconProps) {
  // Hide badge when count is undefined (loading state)
  const shouldShowBadge = count !== undefined
  const safeCount = count ?? 0
  const display = safeCount >= 100 ? '99+' : String(safeCount)
  const glyphLength = display.length

  const fontSize = React.useMemo(() => {
    if (glyphLength >= 3) return 11
    if (glyphLength === 2) return 12.5
    return 14
  }, [glyphLength])

  const reactId = React.useId()
  const gradientId = React.useMemo(
    () => `cartBadgeGradient-${reactId.replace(/:/g, '')}`,
    [reactId]
  )

  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={cn(
        'cart-icon relative inline-flex shrink-0 items-center justify-center',
        className
      )}
      {...rest}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-full w-full text-current"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>

      {shouldShowBadge && (
        <span
          className="cart-icon__badge pointer-events-none absolute right-1 top-1 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg className="cart-icon__badge-svg" width="28" height="28" viewBox="0 0 32 32">
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="12" fill={`url(#${gradientId})`} />
            <text
              x="16"
              y="16"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial"
              fontWeight={700}
              fontSize={fontSize}
              fill="#ffffff"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {display}
            </text>
          </svg>
        </span>
      )}
    </span>
  )
}
