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
        "catalog-card flex h-[400px] w-full flex-col overflow-hidden rounded-2xl border-0 bg-card shadow-sm transition-all duration-200 hover:shadow-md",
        className,
      )}
      data-grid-card
      aria-hidden="true"
    >
      <CardContent className="catalog-card__content flex flex-1 flex-col gap-3 px-5 pb-4 pt-5">
        <div className="catalog-card__media relative">
          <div
            className="relative flex aspect-square w-full items-center justify-center rounded-xl bg-card p-3 md:p-4"
            aria-hidden="true"
          >
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>
        <div className="catalog-card__details flex flex-col gap-2 px-4">
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
      <CardFooter className="catalog-card__footer flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-4 pb-4 pt-5">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-3 overflow-hidden">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-3 pl-4">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  )
}

