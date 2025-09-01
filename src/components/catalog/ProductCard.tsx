import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ProductCardProps = {
  title: string
  imageUrl: string
  packSize?: string
  suppliersCount?: number
  onAdd?: () => void
  isAdding?: boolean
  className?: string
}

export function ProductCard({
  title,
  imageUrl,
  packSize,
  suppliersCount = 1,
  onAdd,
  isAdding,
  className,
}: ProductCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-sm transition",
        "hover:shadow-md hover:border-primary/30",
        // keep cards visually uniform in all grids:
        "w-full max-w-[340px]",
        className,
      )}
    >
      <div className="relative">
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>

        <Badge
          variant="secondary"
          className="absolute left-2 top-2 rounded-full bg-background/80 px-2 text-[11px] backdrop-blur dark:bg-background/70"
        >
          {suppliersCount} {suppliersCount === 1 ? "supplier" : "suppliers"}
        </Badge>
      </div>

      <CardContent className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">
          {title}
        </h3>
        {packSize ? (
          <p className="text-sm text-muted-foreground">{packSize}</p>
        ) : null}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          onClick={onAdd}
          disabled={isAdding}
          size="lg"
          className="h-10 w-full rounded-xl font-medium"
        >
          {isAdding ? "Adding…" : "Add"}
        </Button>
      </CardFooter>
    </Card>
  )
}

