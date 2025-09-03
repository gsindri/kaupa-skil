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

  const availability = (product.availability_status ?? "unknown") as
    | "in_stock"
    | "low"
    | "out"
    | "unknown";
  const availabilityClass =
    availability === "in_stock"
      ? "bg-emerald-100 text-emerald-700"
      : availability === "out"
        ? "bg-rose-100 text-rose-700"
        : availability === "low"
          ? "bg-amber-100 text-amber-700"
          : "bg-muted text-muted-foreground";
  const availabilityLabel =
    product.availability_text ??
    (availability === "in_stock"
      ? "In stock"
      : availability === "out"
        ? "Out of stock"
        : availability === "low"
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
        "flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <Badge
          className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-muted-foreground shadow"
          variant="secondary"
        >
          {supplierLabel}
        </Badge>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <a {...linkProps} className="text-sm font-medium line-clamp-2 hover:underline">
          {product.name}
        </a>
        {packInfo ? (
          <div className="mt-1 text-xs text-muted-foreground">{packInfo}</div>
        ) : null}
        <div className="mt-2">
          <span
            className={cn(
              "inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
              availabilityClass,
            )}
            title={
              product.availability_updated_at
                ? `Updated ${timeAgo(product.availability_updated_at)}`
                : undefined
            }
          >
            {availabilityLabel}
          </span>
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
          disabled={isAdding || availability === "out"}
          aria-label={`Add ${product.name}`}
        >
          {isAdding ? "Adding…" : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}

