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
        "flex h-[368px] w-full flex-col overflow-hidden rounded-[20px] border border-transparent bg-card/95 shadow-sm",
        className,
      )}
      data-grid-card
      aria-hidden="true"
    >
      <Skeleton className="aspect-[4/3] w-full bg-muted/60" />
      <CardContent className="flex flex-1 flex-col px-5 pb-0 pt-5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-3.5 w-1/2" />
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex items-center gap-3 px-5 pb-5 pt-3">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <div className="ml-auto flex items-center gap-3 pl-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  )
}

