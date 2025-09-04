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
    <Avatar className="h-6 w-6">
      {logoUrl && <AvatarImage src={logoUrl} alt={name} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  )
}

