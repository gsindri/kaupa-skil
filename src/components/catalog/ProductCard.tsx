import { Card, CardContent, CardFooter } from "@/components/ui/card";
import SupplierLogo from "./SupplierLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import AvailabilityBadge from "./AvailabilityBadge";
import type { PublicCatalogItem } from "@/services/catalog";
import { resolveImage } from "@/lib/images";

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
  const availability = (product.availability_status ?? "UNKNOWN") as
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "UNKNOWN";
  const img = resolveImage(
    product.sample_image_url,
    availability,
  );
  const supplierLabel = `${product.suppliers_count} supplier${
    product.suppliers_count === 1 ? "" : "s"
  }`;
  const primarySupplierName = product.supplier_names?.[0] ?? "";
  const primarySupplierLogo = product.supplier_logo_urls?.[0] ?? null;
  const packInfo =
    product.canonical_pack ?? product.pack_sizes?.join(", ") ?? "";

  const handleAdd = () => {
    if (onAdd) return onAdd();
    console.log("Add to basket", product.catalog_id);
  };

  const isUnavailable =
    availability === "OUT_OF_STOCK" ||
    (availability === "UNKNOWN" && product.active_supplier_count === 0);

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
        <div className="mt-1 min-h-[1rem] text-xs text-muted-foreground">
          {packInfo}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 min-h-[24px]">
          <AvailabilityBadge
            status={availability}
            updatedAt={product.availability_updated_at}
          />
          {product.suppliers_count > 0 && (
            <div className="flex items-center gap-1">
              <SupplierLogo
                name={primarySupplierName || supplierLabel}
                logoUrl={primarySupplierLogo}
              />
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {primarySupplierName
                  ? `${supplierLabel} / ${primarySupplierName}`
                  : supplierLabel}
              </span>
            </div>
          )}
          {product.active_supplier_count === 0 && (
            <span className="inline-flex items-center rounded-full border border-muted-foreground/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Not seen recently
            </span>
          )}
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
          disabled={isAdding || isUnavailable}
          aria-label={`Add ${product.name}`}
        >
          {isAdding ? "Adding…" : "Add to cart"}
        </Button>
      </CardFooter>
    </Card>
  );
}

