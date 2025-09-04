import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Lock } from "lucide-react"
import { timeAgo } from "@/lib/timeAgo"
import type { AvailabilityStatus } from "@/components/catalog/AvailabilityBadge"

interface SupplierChipProps {
  name: string
  logoUrl?: string | null
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
  )
}

