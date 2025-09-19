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
        "catalog-card flex h-[368px] w-full flex-col overflow-hidden rounded-[20px] border-0 bg-[color:var(--catalog-card-surface)] shadow-none",
        className,
      )}
      data-grid-card
      aria-hidden="true"
    >
      <div className="relative px-4 pt-4">
        <div className="catalog-card__surface aspect-[4/3] w-full" aria-hidden="true">
          <div className="catalog-card__image-frame">
            <Skeleton className="catalog-card__image-placeholder rounded-[12px] bg-transparent" />
          </div>
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col px-4 pb-0 pt-4">
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="mt-3 h-4 w-1/2" />
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex flex-nowrap items-center gap-3 px-4 pb-4 pt-4">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2.5 overflow-hidden">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-3 pl-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  )
}

