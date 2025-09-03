import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/timeAgo";
import { formatCurrency } from "@/lib/format";
import type { PublicCatalogItem } from "@/services/catalog";

interface ProductCardProps {
  product: PublicCatalogItem;
  onAdd?: () => void;
  isAdding?: boolean;
  className?: string;
  showPrice?: boolean;
}

export function ProductCard({
  product,
  onAdd,
  isAdding,
  className,
  showPrice,
}: ProductCardProps) {
  const img = product.sample_image_url ?? "/placeholder.svg";
  const supplierLabel = `${product.suppliers_count} supplier${
    product.suppliers_count === 1 ? "" : "s"
  }`;
  const packInfo =
    product.canonical_pack ?? product.pack_sizes?.join(", ") ?? "";

  const availability = (product.availability_status ?? "UNKNOWN") as
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "UNKNOWN";
  const availabilityClass =
    availability === "IN_STOCK"
      ? "bg-emerald-100 text-emerald-700"
      : availability === "OUT_OF_STOCK"
        ? "bg-rose-100 text-rose-700"
        : availability === "LOW_STOCK"
          ? "bg-amber-100 text-amber-700"
          : "bg-muted text-muted-foreground";
  const availabilityLabel =
    product.availability_text ??
    (availability === "IN_STOCK"
      ? "In stock"
      : availability === "OUT_OF_STOCK"
        ? "Out of stock"
        : availability === "LOW_STOCK"
          ? "Low stock"
          : "Availability unknown");

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
    <Card
      className={cn(
        "group flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border shadow-md transition-shadow duration-300 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <a {...linkProps} className="text-sm font-medium line-clamp-2 hover:underline">
          {product.name}
        </a>
        {packInfo ? (
          <div className="mt-1 text-xs text-muted-foreground">{packInfo}</div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1 min-h-[24px]">
          <Badge
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-medium",
              availabilityClass,
            )}
            title={
              product.availability_updated_at
                ? `Updated ${timeAgo(product.availability_updated_at)}`
                : undefined
            }
          >
            {availabilityLabel}
          </Badge>
          <Badge
            variant="secondary"
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          >
            {supplierLabel}
          </Badge>
        </div>
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex flex-col p-4 pt-0">
        {showPrice && product.best_price != null ? (
          <div className="mb-2 text-sm font-medium">
            {formatCurrency(product.best_price)}
          </div>
        ) : (
          <div className="mb-2 text-xs text-muted-foreground">
            Connect supplier to see price
          </div>
        )}
        <Button
          size="lg"
          className="w-full rounded-xl"
          onClick={handleAdd}
          disabled={isAdding || availability === "OUT_OF_STOCK"}
          aria-label={`Add ${product.name}`}
        >
          {isAdding ? "Adding…" : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}

