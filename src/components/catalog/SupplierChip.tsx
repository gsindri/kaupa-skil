
interface AvailabilityInfo {
  status?: AvailabilityStatus | null
  updatedAt?: string | Date | null
}

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
}

  const initials = name
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
