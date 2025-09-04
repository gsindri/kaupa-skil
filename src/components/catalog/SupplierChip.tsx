import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Lock } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus } from '@/components/catalog/AvailabilityBadge'

interface AvailabilityInfo {
  status?: AvailabilityStatus | null
  updatedAt?: string | Date | null
}

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
  connected?: boolean
  availability?: AvailabilityInfo
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

  const base = (
    <div className={cn('relative inline-flex', className)} {...props}>
      <Avatar className="h-full w-full">
        {logoUrl ? <AvatarImage src={logoUrl} alt={name} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80">
          <Lock className="h-3 w-3 text-muted-foreground" />
        </div>
      )}

      {availability && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full',
                AVAILABILITY_MAP[availability.status ?? 'UNKNOWN'].color
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {`${AVAILABILITY_MAP[availability.status ?? 'UNKNOWN'].label}. Last checked ${
              availability.updatedAt
                ? timeAgo(
                    typeof availability.updatedAt === 'string'
                      ? availability.updatedAt
                      : availability.updatedAt.toISOString()
                  )
                : 'unknown'
            }.`}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )

  if (!connected) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{base}</TooltipTrigger>
        <TooltipContent>
          {`Price locked. Connect ${name} to view price.`}
        </TooltipContent>
      </Tooltip>
    )
  }

  return base
}

