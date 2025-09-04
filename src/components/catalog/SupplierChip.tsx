import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Lock } from "lucide-react"
import { timeAgo } from "@/lib/timeAgo"
import type { AvailabilityStatus } from "@/components/catalog/AvailabilityBadge"

interface SupplierChipProps {
  name: string
  logoUrl?: string | null
  connected?: boolean
  availability?: {
    status: AvailabilityStatus
    updatedAt?: string | null
  } | null
}

const AVAILABILITY_STYLES: Record<
  AvailabilityStatus,
  { color: string; label: string }
> = {
  IN_STOCK: { color: "bg-emerald-500", label: "In stock" },
  LOW_STOCK: { color: "bg-amber-500", label: "Low stock" },
  OUT_OF_STOCK: { color: "bg-rose-500", label: "Out of stock" },
  UNKNOWN: { color: "bg-muted-foreground", label: "Unknown" },
}

export default function SupplierChip({
  name,
  logoUrl,
  connected = true,
  availability,
}: SupplierChipProps) {
  const initials = name
    .split(" ")
    .map(s => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const state = availability?.status ?? "UNKNOWN"
  const info = AVAILABILITY_STYLES[state]
  const time = availability?.updatedAt ? timeAgo(availability.updatedAt) : "unknown"

  return (
    <div className="relative">
      <Avatar
        className="h-6 w-6 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        tabIndex={0}
        aria-label={name}
      >
        {logoUrl && <AvatarImage src={logoUrl} alt="" />}
        <AvatarFallback aria-hidden>{initials}</AvatarFallback>
      </Avatar>

      {!connected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Lock
              className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-background p-0.5 text-muted-foreground"
            />
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            Price locked. Connect {name} to view price.
          </TooltipContent>
        </Tooltip>
      )}

      {availability && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${info.color}`}
            />
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {info.label}. Last checked {time}.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

