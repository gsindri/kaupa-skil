import { useEffect, useRef, useState, type ReactNode, forwardRef } from 'react'
import { AlertTriangle, Check, HelpCircle, Loader2, Slash } from 'lucide-react'

import { timeAgo } from '@/lib/timeAgo'
import { cn } from '@/lib/utils'

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | null
  updatedAt?: string | null
  tabIndex?: number
  className?: string
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
    className: 'badge badge--low',
    aria: 'Low stock',
  },
  OUT_OF_STOCK: {
    icon: <Slash className="icon-16" aria-hidden="true" />,
    label: 'Out',
    className: 'badge badge--out',
    aria: 'Out of stock',
  },
  UNKNOWN: {
    icon: <HelpCircle className="icon-16" aria-hidden="true" />,
    label: 'Unknown',
    className: 'badge badge--unknown',
    aria: 'Availability unknown',
  },
}

const AvailabilityBadge = forwardRef<HTMLSpanElement, AvailabilityBadgeProps>(
  ({ status = 'UNKNOWN', updatedAt, tabIndex = 0, className }, ref) => {
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

    const prefersReducedMotionRef = useRef(false)
    const [pulse, setPulse] = useState(false)
    const prevStatus = useRef<AvailabilityStatus | 'INIT' | null>('INIT')

    useEffect(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      const assign = (event: MediaQueryList | MediaQueryListEvent) => {
        prefersReducedMotionRef.current = event.matches
      }
      assign(query)
      const handler = (event: MediaQueryListEvent) => assign(event)
      query.addEventListener('change', handler)
      return () => query.removeEventListener('change', handler)
    }, [])

    useEffect(() => {
      if (isChecking) return
      const normalized = status ?? 'UNKNOWN'
      if (
        prevStatus.current &&
        prevStatus.current !== 'INIT' &&
        prevStatus.current !== normalized &&
        !prefersReducedMotionRef.current
      ) {
        setPulse(true)
        const id = window.setTimeout(() => setPulse(false), 180)
        prevStatus.current = normalized
        return () => window.clearTimeout(id)
      }
      prevStatus.current = normalized
      if (prefersReducedMotionRef.current) {
        setPulse(false)
      }
    }, [status, isChecking])

    const time = updatedAt ? timeAgo(updatedAt) : null
    const ariaLabel = time ? `${aria}, checked ${time}` : aria

    return (
      <span
        ref={ref}
        className={cn(variantClass, 'ui-numeric', className, pulse && 'catalog-chip--pulse')}
        aria-label={ariaLabel}
        tabIndex={tabIndex}
      >
        {iconNode}
        {label}
      </span>
    )
  },
)

AvailabilityBadge.displayName = 'AvailabilityBadge'

export default AvailabilityBadge

