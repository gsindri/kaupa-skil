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
      <div className="relative px-4 pt-3">
        <div className="catalog-card__surface aspect-[4/3] w-full bg-muted/30 rounded-xl overflow-hidden" aria-hidden="true">
          <div className="catalog-card__image-frame h-full w-full bg-gradient-to-b from-background/50 to-muted/50">
            <Skeleton className="catalog-card__image h-full w-full rounded-none" />
          </div>
        </div>
      </div>
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2.5 overflow-hidden">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-3 pl-3">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  )
}

