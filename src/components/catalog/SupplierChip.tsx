
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'
import { timeAgo } from '@/lib/timeAgo'
import type { AvailabilityStatus } from '@/components/catalog/AvailabilityBadge'
import { cn } from '@/lib/utils'

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
  connected?: boolean
  availability?: {
    status?: AvailabilityStatus | null
    updatedAt?: string | Date | null
  }
}

const AVAILABILITY_MAP: Record<
  AvailabilityStatus | 'UNKNOWN',
  { color: string; label: string }
> = {
  IN_STOCK: { color: 'bg-emerald-500', label: 'In stock' },
  LOW_STOCK: { color: 'bg-amber-500', label: 'Low stock' },
  OUT_OF_STOCK: { color: 'bg-rose-500', label: 'Out of stock' },
  UNKNOWN: { color: 'bg-muted-foreground', label: 'Availability unknown' },
}

export default function SupplierChip({
  name,
  logoUrl,
  connected = true,
  availability,
  className,
  ...props
}: SupplierChipProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(s => s[0]!)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const status = availability?.status ?? 'UNKNOWN'
  const state = AVAILABILITY_MAP[status]
  const updatedAt = availability?.updatedAt
  const time = updatedAt ? timeAgo(updatedAt as string | Date) : 'unknown'

  const { tabIndex, ['aria-label']: ariaLabelProp, ...rest } = props as any
  const ariaLabel = !connected
    ? `${name} (price locked)`
    : ariaLabelProp ?? name

  return (
    <div
      className={cn('relative inline-block', className)}
      tabIndex={tabIndex ?? 0}
      aria-label={ariaLabel}
      {...rest}
    >
      <Avatar className="h-full w-full">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt={name} />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>

      {!connected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Lock className="h-3 w-3 text-white" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Price locked. Connect {name} to view price.
          </TooltipContent>
        </Tooltip>
      )}

      {availability && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background',
                state.color,
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {state.label}. Last checked {time}.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

