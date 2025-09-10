import { timeAgo } from '@/lib/timeAgo'
import { cn } from '@/lib/utils'
import { Check, Loader2, AlertTriangle, Slash } from 'lucide-react'
import { type ReactNode, forwardRef } from 'react'

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | null
  updatedAt?: string | null
  tabIndex?: number
}

const MAP: Record<
  AvailabilityStatus,
  { icon?: ReactNode; label: string; className: string; aria: string }
> = {
  IN_STOCK: {
    icon: <Check className="icon-16" aria-hidden="true" />,
    label: 'In',
    className: 'badge badge--in',
    aria: 'In stock',
  },
  LOW_STOCK: {
    icon: <AlertTriangle className="icon-16" aria-hidden="true" />,
    label: 'Low',
    className: 'badge badge--in',
    aria: 'Low stock',
  },
  OUT_OF_STOCK: {
    icon: <Slash className="icon-16" aria-hidden="true" />,
    label: 'Out',
    className: 'badge badge--out',
    aria: 'Out of stock',
  },
  UNKNOWN: {
    label: '—',
    className: 'badge badge--unknown',
    aria: 'Availability unknown',
  },
}

const AvailabilityBadge = forwardRef<HTMLSpanElement, AvailabilityBadgeProps>(
  ({ status = 'UNKNOWN', updatedAt, tabIndex = 0 }, ref) => {
  const isChecking = status === null

  const base = MAP[status ?? 'UNKNOWN'] ?? MAP.UNKNOWN

  let iconNode: ReactNode = base.icon ?? null
  let label: string | null = base.label
  let variantClass = base.className
  let aria = base.aria

  if (isChecking) {
    iconNode = <Loader2 className="icon-16 animate-spin" aria-hidden="true" />
    label = null
    variantClass = 'badge badge--unknown'
    aria = 'Checking availability'
  }

  const time = updatedAt ? timeAgo(updatedAt) : null
  const ariaLabel = time ? `${aria}, checked ${time}` : aria

  return (
    <span
      ref={ref}
      className={cn(variantClass, 'ui-numeric')}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {iconNode}
      {label === '—' ? (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">No data yet</span>
        </>
      ) : (
        label
      )}
    </span>
  )
})

AvailabilityBadge.displayName = 'AvailabilityBadge'

export default AvailabilityBadge

