import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CatalogItem } from "@/services/catalog"

type ProductCardProps = {
  product: CatalogItem
  onAdd?: () => void
  isAdding?: boolean
  className?: string
  showPrice?: boolean
}

export function ProductCard({
  product,
  onAdd,
  isAdding,
  className,
  showPrice = false,
}: ProductCardProps) {
  const {
    name,
    image_main,
    pack_size,
    brand,
    supplier_count,
    suppliers,
    availability,
    best_price,
    currency,
  } = product

  return (
    <Card
      className={cn(
        "group relative flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border shadow-sm transition",
        "hover:shadow-md hover:border-primary/30",
        className,
      )}
    >
      <div className="relative">
        <div className="aspect-square w-full overflow-hidden bg-muted/40 flex items-center justify-center">
          <img
            src={image_main ?? "/placeholder.svg"}
            alt={name}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </div>

        <Badge
          variant="secondary"
          className="absolute left-2 top-2 rounded-full bg-background/80 px-2 text-[11px] backdrop-blur dark:bg-background/70"
        >
          {supplier_count} {supplier_count === 1 ? "supplier" : "suppliers"}
        </Badge>
      </div>

      <CardContent className="flex-1 space-y-1.5 p-4">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug">
          {name}
        </h3>
        {brand && (
          <p className="text-sm text-muted-foreground">{brand}</p>
        )}
        {pack_size && (
          <p className="text-sm text-muted-foreground">{pack_size}</p>
        )}
        {suppliers && suppliers.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {suppliers.map(s => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        ) : null}
        {availability && (
          <p className="text-xs text-muted-foreground">{availability}</p>
        )}
        {showPrice && (
          <p className="text-sm font-medium">
            {best_price != null && currency
              ? `${best_price.toFixed(2)} ${currency}`
              : "No price"}
          </p>
        )}
      </CardContent>

      <CardFooter className="mt-auto p-4 pt-0">
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

