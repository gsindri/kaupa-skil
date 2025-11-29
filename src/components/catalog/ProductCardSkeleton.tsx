import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ProductCardSkeletonProps = {
  className?: string
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "relative flex h-[420px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
      data-grid-card
      aria-hidden="true"
    >
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        {/* Product image skeleton */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/30">
          <div className="absolute inset-0 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 bg-[length:200%_100%] animate-shimmer" />
        </div>
        
        {/* Product title and brand */}
        <div className="space-y-2">
          <div className="h-4 w-5/6 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
          <div className="h-3 w-1/2 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '100ms' }} />
        </div>
        
        {/* Meta information */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '200ms' }} />
          <div className="h-3 w-16 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '200ms' }} />
        </div>
        
        {/* Footer with price and button */}
        <div className="mt-auto w-full">
          <div className="mt-4 border-t border-border pt-3">
            <div className="flex h-12 items-center justify-between">
              <div className="h-5 w-28 rounded bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '300ms' }} />
              <div className="h-9 w-24 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 bg-[length:200%_100%] animate-shimmer" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

