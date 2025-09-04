import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
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

  const avatar = (
    <Avatar className={cn('h-8 w-8', className, !connected && 'opacity-50')} {...props}>
      {logoUrl ? (
        <AvatarImage src={logoUrl} alt={name} />
      ) : (
        <AvatarFallback>{initials}</AvatarFallback>
      )}
    </Avatar>
  )

  if (availability) {
    const time = availability.updatedAt
      ? timeAgo(
          typeof availability.updatedAt === 'string'
            ? availability.updatedAt
            : availability.updatedAt.toISOString()
        )
      : 'unknown'
    return (
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent>{`Last updated ${time}`}</TooltipContent>
      </Tooltip>
    )
  }

  return avatar
}

