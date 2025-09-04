import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
  connected?: boolean
  availability?: {
    status?: string | null
    updatedAt?: string | Date | null
  }
}

export default function SupplierChip({
  name,
  logoUrl,
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

  return (
    <div className={className} {...props}>
      <Avatar className="h-5 w-5">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt={name} />
        ) : (
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        )}
      </Avatar>
    </div>
  )
}

