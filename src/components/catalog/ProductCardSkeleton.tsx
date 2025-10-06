import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ProductCardSkeletonProps = {
  className?: string
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "relative flex h-[420px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200",
        "hover:shadow-md",
        className,
      )}
      data-grid-card
      aria-hidden="true"
    >
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/20">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="mt-auto w-full">
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex h-12 items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

