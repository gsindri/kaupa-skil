import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'
import { timeAgo } from '@/lib/timeAgo'
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
  className = '',
  ...props
}: SupplierChipProps) {
  const initials = name
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const avatar = (
    <div
      className={`relative flex h-full w-full items-center justify-center rounded-full border bg-background ${className}`}
      {...props}
    >
      <Avatar className="h-full w-full">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt="" />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>
      {!connected && (
        <Lock className="absolute h-3 w-3 text-muted-foreground" />
      )}
      <span className="sr-only">{name}</span>
    </div>
  )

  if (availability) {
    const time = availability.updatedAt ? timeAgo(availability.updatedAt) : 'unknown'
    return (
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent>{`Last updated ${time}`}</TooltipContent>
      </Tooltip>
    )
  }

  return avatar
}

