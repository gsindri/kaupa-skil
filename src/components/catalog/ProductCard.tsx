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
import type { CartItem } from "@/lib/types";
import { CatalogQuantityStepper } from "./CatalogQuantityStepper";
import { BellRing, HelpCircle, Loader2, Lock, Plus } from "lucide-react";

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
  const { addItem, items, updateQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const availability = (product.availability_status ?? "UNKNOWN") as
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "UNKNOWN";
  const img = resolveImage(product.sample_image_url, availability);
  const supplierLabel = `${product.suppliers_count} supplier${
    product.suppliers_count === 1 ? "" : "s"
  }`;
  const primarySupplierName = product.supplier_names?.[0] ?? "";
  const primarySupplierLogo = product.supplier_logo_urls?.[0] ?? null;
  const packInfo = product.canonical_pack ?? product.pack_sizes?.join(", ") ?? "";
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

  const { cartItem, cartQuantity } = useMemo(() => {
    let total = 0;
    let found: CartItem | null = null;
    for (const entry of items) {
      if (entry.supplierItemId === product.catalog_id) {
        total += entry.quantity;
        if (!found) {
          found = entry;
        }
      }
    }
    return { cartItem: found, cartQuantity: total };
  }, [items, product.catalog_id]);

  const isInCart = cartQuantity > 0;

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

  const detailLink = product.sample_source_url
    ? {
        href: product.sample_source_url,
        target: "_blank" as const,
        rel: "noreferrer" as const,
      }
    : undefined;

  const allowPrice = showPrice !== false;
  const hasVisiblePrice = allowPrice && product.best_price != null;
  const isPriceLocked = allowPrice && product.best_price == null;
  const priceLabel = hasVisiblePrice
    ? formatCurrency(product.best_price ?? 0)
    : null;

  const renderPrimaryAction = () => {
    if (isUnavailable && !isInCart) {
      return (
        <Button
          type="button"
          variant="ghost"
          size="default"
          className="catalog-card__cta catalog-card__cta--muted"
          disabled
          aria-disabled="true"
        >
          <BellRing className="h-4 w-4" aria-hidden="true" />
          Notify me
        </Button>
      );
    }

    if (isPriceLocked) {
      const content = (
        <>
          <Lock className="h-4 w-4" aria-hidden="true" />
          See price
        </>
      );
      if (detailLink) {
        return (
          <Button
            asChild
            variant="default"
            size="default"
            className="catalog-card__cta catalog-card__cta--primary"
          >
            <a {...detailLink} aria-label={`See price for ${product.name}`}>
              {content}
            </a>
          </Button>
        );
      }
      return (
        <Button
          type="button"
          variant="default"
          size="default"
          className="catalog-card__cta catalog-card__cta--primary"
          disabled
          aria-disabled="true"
        >
          {content}
        </Button>
      );
    }

    if (isInCart && cartItem) {
      return (
        <CatalogQuantityStepper
          quantity={cartQuantity}
          onChange={qty => updateQuantity(cartItem.supplierItemId, qty)}
          onRemove={() => removeItem(cartItem.supplierItemId)}
          itemLabel={product.name}
          canIncrease={!isUnavailable}
        />
      );
    }

    if (hasMultipleSuppliers) {
      return (
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
      );
    }

    return (
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
    );
  };

  return (
    <Card
      data-grid-card
      data-in-cart={isInCart ? "true" : undefined}
      className={cn(
        "catalog-card group isolate flex h-[368px] w-full flex-col overflow-hidden border-0 bg-[color:var(--catalog-card-surface)] shadow-none",
        "rounded-[20px] transition-[box-shadow,transform,background-color] duration-base ease-snap",
        "hover:-translate-y-[2px] focus-within:-translate-y-[2px]",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
        className,
      )}
    >
      <div className="relative px-4 pt-4">
        <div className="catalog-card__surface aspect-[4/3] w-full">
          <div className="catalog-card__badge-layer" data-badge-slot>
            {isInCart && (
              <span className="catalog-card__count-chip" aria-hidden="true">
                {cartQuantity}
              </span>
            )}
          </div>
          <div className="catalog-card__image-frame">
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              className="catalog-card__image transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          </div>
        </div>
        <div className="catalog-card__glint" aria-hidden="true" />
      </div>
      <CardContent className="flex flex-1 flex-col px-4 pb-0 pt-4">
        {detailLink ? (
          <a
            {...detailLink}
            className="catalog-card__title catalog-card__title-link focus-visible:outline-none"
          >
            {product.name}
          </a>
        ) : (
          <div className="catalog-card__title">{product.name}</div>
        )}
        <div className="catalog-card__meta" aria-hidden={!metaLine}>
          {metaLine || "\u00A0"}
        </div>
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="catalog-card__footer flex flex-nowrap items-center gap-3 px-4 pb-4 pt-4">
        <div className="catalog-card__footer-meta flex min-w-0 flex-1 flex-nowrap items-center gap-2.5 overflow-hidden">
          <AvailabilityBadge
            status={availability}
            updatedAt={product.availability_updated_at}
            className="flex-shrink-0"
          />
          {product.suppliers_count > 0 && (
            <span className="catalog-chip flex min-w-0 items-center gap-2">
              <SupplierLogo
                name={primarySupplierName || supplierLabel}
                logoUrl={primarySupplierLogo}
                className="!h-7 !w-7 flex-shrink-0 !rounded-full bg-white/80 shadow-sm"
              />
              <span className="catalog-card__supplier-label truncate">
                {bestSupplierLabel}
              </span>
            </span>
          )}
          {overflowSupplierCount > 0 && (
            <span className="catalog-chip catalog-chip--quiet flex-shrink-0">
              +{overflowSupplierCount}
            </span>
          )}
          {product.active_supplier_count === 0 && (
            <span className="catalog-chip catalog-chip--quiet flex-shrink-0">
              Not seen recently
            </span>
          )}
        </div>
        <div className="catalog-card__footer-actions ml-auto flex flex-shrink-0 items-center gap-3 pl-3">
          {priceLabel && (
            <div className="catalog-card__price" aria-live="polite">
              {priceLabel}
            </div>
          )}
          {renderPrimaryAction()}
        </div>
      </CardFooter>
    </Card>
  );
});

