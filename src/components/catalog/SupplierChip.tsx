import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Lock } from 'lucide-react'

interface SupplierChipProps {
  name: string
  logoUrl?: string | null
  /** Whether the supplier is connected */
  connected?: boolean
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

  return (
    <div className="relative">
      <Avatar className="h-5 w-5">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt={name} />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>
      {!connected && (
        <Lock className="absolute right-0 bottom-0 h-3 w-3 text-muted-foreground" />
      )}
    </div>
  )
}

