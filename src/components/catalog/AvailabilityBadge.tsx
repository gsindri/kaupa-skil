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
    icon: <Check className="h-3 w-3" aria-hidden="true" />,
    label: 'In',
    className: 'bg-green-100 text-green-700',
    aria: 'In stock',
  },
  LOW_STOCK: {
    icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    label: 'Low',
    className: 'bg-amber-100 text-amber-700',
    aria: 'Low stock',
  },
  OUT_OF_STOCK: {
    icon: <Slash className="h-3 w-3" aria-hidden="true" />,
    label: 'Out',
    className: 'bg-red-100 text-red-700',
    aria: 'Out of stock',
  },
  UNKNOWN: {
    label: '—',
    className: 'bg-muted text-muted-foreground',
    aria: 'Availability unknown',
  },
}

const AvailabilityBadge = forwardRef<HTMLSpanElement, AvailabilityBadgeProps>(
  ({ status = 'UNKNOWN', updatedAt, tabIndex = 0 }, ref) => {
  const isChecking = status === null

  const base = MAP[status ?? 'UNKNOWN'] ?? MAP.UNKNOWN

  let iconNode: ReactNode = base.icon ?? null
  let label: string | null = base.label
  let className = base.className
  let aria = base.aria

  if (isChecking) {
    iconNode = <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
    label = null
    className = 'bg-muted text-muted-foreground'
    aria = 'Checking availability'
  }

  const time = updatedAt ? timeAgo(updatedAt) : null
  const ariaLabel = time ? `${aria}, checked ${time}` : aria

  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1 px-2.5 h-6 min-w-[44px] rounded-full text-xs font-medium leading-none cursor-default',
        className,
      )}
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

