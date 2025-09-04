import { Badge } from '@/components/ui/badge'
import { timeAgo } from '@/lib/timeAgo'

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | null
  updatedAt?: string | null
}

const MAP: Record<AvailabilityStatus, { icon: string; label: string; className: string; aria: string }> = {
  IN_STOCK: {
    icon: '✓',
    label: 'In',
    className: 'bg-emerald-100 text-emerald-700',
    aria: 'In stock',
  },
  LOW_STOCK: {
    icon: '!',
    label: 'Low',
    className: 'bg-amber-100 text-amber-700',
    aria: 'Low stock',
  },
  OUT_OF_STOCK: {
    icon: '⃠',
    label: 'Out',
    className: 'bg-rose-100 text-rose-700',
    aria: 'Out of stock',
  },
  UNKNOWN: {
    icon: '?',
    label: '—',
    className: 'bg-muted text-muted-foreground',
    aria: 'Availability unknown',
  },
}

export default function AvailabilityBadge({ status = 'UNKNOWN', updatedAt }: AvailabilityBadgeProps) {
  const { icon, label, className, aria } = MAP[status] ?? MAP.UNKNOWN
  const time = updatedAt ? timeAgo(updatedAt) : null
  const ariaLabel = time ? `${aria}, checked ${time}` : aria

  return (
    <Badge
      className={`gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      aria-label={ariaLabel}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </Badge>
  )
}

