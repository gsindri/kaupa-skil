import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/timeAgo";
import type { PublicCatalogItem } from "@/services/catalog";

interface ProductCardProps {
  product: PublicCatalogItem;
  onAdd?: () => void;
  isAdding?: boolean;
  className?: string;
}

export function ProductCard({ product, onAdd, isAdding, className }: ProductCardProps) {
  const img = product.sample_image_url ?? "/placeholder.svg";
  const supplierLabel = `${product.suppliers_count} supplier${
    product.suppliers_count === 1 ? "" : "s"
  }`;
  const size = product.pack_size ?? product.size ?? "";

  const availability = (product.availability_status ?? "UNKNOWN") as
    | "IN_STOCK"
    | "OUT_OF_STOCK"
    | "UNKNOWN";
  const availabilityClass =
    availability === "IN_STOCK"
      ? "bg-emerald-100 text-emerald-700"
      : availability === "OUT_OF_STOCK"
        ? "bg-rose-100 text-rose-700"
        : "bg-muted text-muted-foreground";

  const handleAdd = () => {
    if (onAdd) return onAdd();
    console.log("Add to basket", product.catalog_id);
  };

  const linkProps = product.sample_source_url
    ? {
        href: product.sample_source_url,
        target: "_blank" as const,
        rel: "noreferrer" as const,
      }
    : { href: "#" };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardContent className="p-3 flex-1 flex flex-col">
        <a {...linkProps} className="relative block aspect-[4/3] w-full overflow-hidden rounded-md bg-muted">
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-contain"
            loading="lazy"
          />
          <Badge className="absolute left-2 top-2 text-[11px]" variant="secondary">
            {supplierLabel}
          </Badge>
        </a>

        <a
          {...linkProps}
          className="mt-3 text-sm font-medium line-clamp-2 hover:underline"
        >
          {product.name}
        </a>

        {product.brand ? (
          <div className="text-xs text-muted-foreground mt-0.5">{product.brand}</div>
        ) : null}

        {size ? (
          <div className="text-xs text-muted-foreground mt-0.5">{size}</div>
        ) : null}

        <div className="mt-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
              availabilityClass,
            )}
            title={
              product.availability_updated_at
                ? `Updated ${timeAgo(product.availability_updated_at)}`
                : undefined
            }
          >
            {availability === "IN_STOCK"
              ? "In stock"
              : availability === "OUT_OF_STOCK"
                ? "Out of stock"
                : "Availability unknown"}
          </span>
        </div>

        <div className="flex-1" />

        <div className="mt-3">
          <div className="text-xs text-muted-foreground mb-2">
            Connect supplier to see price
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={handleAdd}
            disabled={isAdding || availability === "OUT_OF_STOCK"}
            aria-label={`Add ${product.name}`}
          >
            {isAdding ? "Adding…" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

