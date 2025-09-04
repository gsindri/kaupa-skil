import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface SupplierChipProps {
  name: string
  logoUrl?: string | null
}

export default function SupplierChip({ name, logoUrl }: SupplierChipProps) {
  const initials = name
    .split(" ")
    .map(s => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Avatar
      className="h-6 w-6 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      tabIndex={0}
      aria-label={name}
    >
      {logoUrl && <AvatarImage src={logoUrl} alt="" />}
      <AvatarFallback aria-hidden>{initials}</AvatarFallback>
    </Avatar>
  )
}

