import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductThumbProps {
  src?: string | null
  name: string
  brand?: string | null
  className?: string
}

export default function ProductThumb({
  src,
  name,
  brand,
  className,
}: ProductThumbProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const initials = brand
    ? brand
        .split(' ')
        .map(s => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  const showFallback = !src || error

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-muted',
        className,
      )}
    >
      {showFallback ? (
        initials ? (
          <span className="text-sm font-medium text-muted-foreground">{initials}</span>
        ) : (
          <Package className="h-4 w-4 text-muted-foreground" />
        )
      ) : (
        <>
          <Skeleton
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-300',
              loaded && 'opacity-0 animate-none'
            )}
          />
          <img
            src={src as string}
            alt={name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      )}
    </div>
  )
}

