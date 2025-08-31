import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonCardProps {
  density?: 'comfortable' | 'compact'
}

export function SkeletonCard({ density = 'comfortable' }: SkeletonCardProps) {
  return (
    <Card className="h-full flex flex-col shadow-sm border border-border bg-card/50">
      <CardContent
        className={cn(
          density === 'compact' ? 'space-y-1 p-2' : 'space-y-2 p-4',
        )}
      >
        <Skeleton
          className={cn(
            'w-full aspect-[4/3] overflow-hidden rounded-md',
            density === 'compact' ? 'mb-1' : 'mb-2',
          )}
        />
        <Skeleton
          className={cn(
            density === 'compact' ? 'h-3 w-3/4' : 'h-4 w-3/4',
          )}
        />
        <Skeleton
          className={cn(
            density === 'compact' ? 'h-3 w-1/2' : 'h-4 w-1/2',
          )}
        />
        <Skeleton
          className={cn(
            density === 'compact' ? 'h-3 w-1/3' : 'h-4 w-1/3',
          )}
        />
      </CardContent>
    </Card>
  )
}

