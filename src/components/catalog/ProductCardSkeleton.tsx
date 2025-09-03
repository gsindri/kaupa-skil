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
        "flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border shadow-sm",
        className,
      )}
    >
      <Skeleton className="aspect-square w-full bg-muted/40" />
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex flex-col p-4 pt-0">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </CardFooter>
    </Card>
  )
}

