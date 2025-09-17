import { memo, useMemo, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import SupplierLogo from "./SupplierLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import AvailabilityBadge from "./AvailabilityBadge";
import type { PublicCatalogItem } from "@/services/catalog";
import { resolveImage } from "@/lib/images";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useCart } from "@/contexts/useBasket";
import { HelpCircle, Loader2, Plus } from "lucide-react";

interface ProductCardProps {
  product: PublicCatalogItem;
  onAdd?: (supplierId?: string) => void;
  isAdding?: boolean;
  className?: string;
  showPrice?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  onAdd,
  isAdding,
  className,
  showPrice,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
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
  const brand = product.brand ?? "";
  const supplierIds = product.supplier_ids ?? [];
  const supplierNames = product.supplier_names ?? [];
  const hasMultipleSuppliers = supplierIds.length > 1;
  const defaultSupplierId = supplierIds[0] ?? "";
  const defaultSupplierName = supplierNames[0] ?? defaultSupplierId;
  const orderedSuppliers = supplierIds.map((id, idx) => ({
    id,
    name: supplierNames[idx] ?? id,
  }));
  const overflowSupplierCount = Math.max(0, supplierIds.length - 1);

  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (packInfo) parts.push(packInfo);
    if (brand) parts.push(brand);
    return parts.join(" • ");
  }, [packInfo, brand]);

  const bestSupplierLabel = useMemo(() => {
    if (hasMultipleSuppliers) {
      return primarySupplierName
        ? `Best from ${primarySupplierName}`
        : `Best option · ${supplierLabel}`;
    }
    return primarySupplierName || supplierLabel;
  }, [hasMultipleSuppliers, primarySupplierName, supplierLabel]);

  const handleAdd = (supplierId: string, supplierName: string) => {
    if (onAdd) {
      onAdd(supplierId);
      return;
    }
    addItem(
      {
        id: product.catalog_id,
        supplierId,
        supplierName,
        itemName: product.name,
        sku: product.catalog_id,
        packSize: packInfo,
        packPrice: product.best_price ?? 0,
        unitPriceExVat: product.best_price ?? 0,
        unitPriceIncVat: product.best_price ?? 0,
        vatRate: 0,
        unit: "",
        supplierItemId: product.catalog_id,
        displayName: product.name,
        packQty: 1,
        image: img,
      },
      1,
    );
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

  const priceDisplay = showPrice && product.best_price != null;

  return (
    <Card
      data-grid-card
      className={cn(
        "catalog-card group isolate flex h-full w-full flex-col overflow-hidden border border-transparent bg-card/95",
        "rounded-[20px] shadow-sm transition-[box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-snap)]",
        "hover:-translate-y-[1px] hover:shadow-md focus-within:-translate-y-[1px]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
        className,
      )}
    >
      <div className="relative">
        <div className="catalog-card__surface aspect-[4/3] w-full bg-muted/60">
          <div className="flex h-full w-full items-center justify-center p-3 sm:p-4">
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="max-h-full max-w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        </div>
        <div className="catalog-card__glint" aria-hidden="true" />
      </div>
      <CardContent className="flex flex-1 flex-col px-5 pb-0 pt-5">
        <a
          {...linkProps}
          className="text-[15px] font-semibold leading-snug text-foreground line-clamp-2"
        >
          {product.name}
        </a>
        <div className="mt-1 min-h-[1rem] text-[12px] font-medium text-muted-foreground/85">
          {metaLine}
        </div>
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex items-center gap-3 px-5 pb-5 pt-3">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden text-xs">
          <AvailabilityBadge
            status={availability}
            updatedAt={product.availability_updated_at}
            className="flex-shrink-0"
          />
          {product.suppliers_count > 0 && (
            <span className="catalog-chip flex min-w-0 items-center gap-2 text-[12px]">
              <SupplierLogo
                name={primarySupplierName || supplierLabel}
                logoUrl={primarySupplierLogo}
                className="h-6 w-6 rounded-full bg-white/70"
              />
              <span className="truncate font-medium text-secondary-foreground/90">
                {bestSupplierLabel}
              </span>
            </span>
          )}
          {overflowSupplierCount > 0 && (
            <span className="catalog-chip catalog-chip--quiet flex-shrink-0 text-[12px] font-semibold">
              +{overflowSupplierCount}
            </span>
          )}
          {product.active_supplier_count === 0 && (
            <span className="catalog-chip catalog-chip--quiet flex-shrink-0 text-[12px]">
              Not seen recently
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-3 pl-2">
          <div className={cn("whitespace-nowrap text-sm font-semibold text-foreground", !priceDisplay && "text-xs font-medium text-muted-foreground")}
            aria-live="polite"
          >
            {priceDisplay ? formatCurrency(product.best_price) : "See price"}
          </div>
          {hasMultipleSuppliers ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  className="catalog-card__cta"
                  disabled={isAdding || isUnavailable}
                  aria-label={`Choose supplier for ${product.name}`}
                >
                  {isAdding ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 space-y-2 p-2" align="end">
                {orderedSuppliers.map(supplier => (
                  <Button
                    key={supplier.id}
                    variant={supplier.id === defaultSupplierId ? "default" : "outline"}
                    onClick={() => {
                      handleAdd(supplier.id, supplier.name);
                      setOpen(false);
                    }}
                    className="justify-start"
                  >
                    {supplier.name}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          ) : (
            <Button
              size="icon"
              className="catalog-card__cta"
              onClick={() => handleAdd(defaultSupplierId, defaultSupplierName)}
              disabled={isAdding || isUnavailable}
              aria-label={`Add ${product.name}`}
            >
              {isAdding ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-5 w-5" aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
});

