import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ProductCardSkeletonProps = {
  className?: string
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm w-full max-w-[340px]",
        className,
      )}
    >
      <Skeleton className="aspect-[4/3] w-full bg-muted/40" />
      <CardContent className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-10 w-full rounded-xl" />
      </CardFooter>
    </Card>
  )
}

