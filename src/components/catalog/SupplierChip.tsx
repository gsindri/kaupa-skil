import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface AvailabilityInfo {
  status?: AvailabilityStatus | null
  updatedAt?: string | Date | null
}

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
}

export default function SupplierChip({
  name,
  logoUrl,
  connected = true,
}: SupplierChipProps) {
  const initials = name
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>
      {!connected && (
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

