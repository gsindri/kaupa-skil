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

type SupplierEntry = {
  supplier_id?: string | null;
  supplierId?: string | null;
  id?: string | null;
  supplier?: { id?: string | null; name?: string | null } | null;
  supplier_name?: string | null;
  name?: string | null;
  displayName?: string | null;
};

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
  const normalizeString = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  };

  const productWithSuppliers = product as PublicCatalogItem & {
    suppliers?: SupplierEntry[] | null;
  };
  const supplierEntries = Array.isArray(productWithSuppliers.suppliers)
    ? productWithSuppliers.suppliers.filter(
        (entry): entry is SupplierEntry => !!entry && typeof entry === "object",
      )
    : [];

  const fallbackNameById = new Map<string, string>();
  const fallbackNameList: string[] = [];
  for (const entry of supplierEntries) {
    const mappedName =
      normalizeString(entry.supplier_name) ??
      normalizeString(entry.name) ??
      normalizeString(entry.displayName) ??
      normalizeString(entry.supplier?.name);
    if (mappedName) {
      fallbackNameList.push(mappedName);
    }
    const mappedId =
      normalizeString(entry.supplier_id) ??
      normalizeString(entry.supplierId) ??
      normalizeString(entry.id) ??
      normalizeString(entry.supplier?.id);
    if (mappedId && mappedName) {
      fallbackNameById.set(mappedId, mappedName);
    }
  }

  const rawSupplierIds = Array.isArray(product.supplier_ids)
    ? product.supplier_ids
    : [];
  const rawSupplierNames = Array.isArray(product.supplier_names)
    ? product.supplier_names
    : [];
  const rawSupplierLogos = Array.isArray(product.supplier_logo_urls)
    ? product.supplier_logo_urls
    : [];

  type NormalizedSupplier = { id: string; name: string; logo: string | null };

  const supplierRecords: NormalizedSupplier[] = [];
  const fallbackQueue = [...fallbackNameList];
  let derivedPrimaryLogo: string | null = null;

  for (let idx = 0; idx < rawSupplierIds.length; idx += 1) {
    const normalizedId = normalizeString(rawSupplierIds[idx]);
    if (!normalizedId) continue;

    const logoCandidate = normalizeString(rawSupplierLogos[idx]);
    if (!derivedPrimaryLogo && logoCandidate) {
      derivedPrimaryLogo = logoCandidate;
    }

    const directName = normalizeString(rawSupplierNames[idx]);
    if (directName) {
      supplierRecords.push({
        id: normalizedId,
        name: directName,
        logo: logoCandidate ?? null,
      });
      continue;
    }

    const mappedName = fallbackNameById.get(normalizedId);
    if (mappedName) {
      supplierRecords.push({
        id: normalizedId,
        name: mappedName,
        logo: logoCandidate ?? null,
      });
      continue;
    }

    let queuedName: string | null = null;
    while (fallbackQueue.length) {
      const candidate = fallbackQueue.shift();
      if (!candidate) continue;
      queuedName = candidate;
      break;
    }

    supplierRecords.push({
      id: normalizedId,
      name: queuedName ?? "",
      logo: logoCandidate ?? null,
    });
  }

  if (!derivedPrimaryLogo) {
    const fallbackLogo = rawSupplierLogos.find(value => !!normalizeString(value));
    derivedPrimaryLogo = fallbackLogo ? normalizeString(fallbackLogo) : null;
  }

  const supplierIds = supplierRecords.map(record => record.id);
  const supplierDisplayNames = supplierRecords.map(record => record.name);

  const supplierCountCandidates = [
    typeof product.suppliers_count === "number" ? product.suppliers_count : null,
    supplierRecords.length,
    fallbackNameList.length,
  ].filter((value): value is number => typeof value === "number" && value > 0);

  const supplierCount = supplierCountCandidates.length
    ? Math.max(...supplierCountCandidates)
    : 0;

  const supplierLabel =
    supplierCount > 0
      ? `${supplierCount} supplier${supplierCount === 1 ? "" : "s"}`
      : "0 suppliers";

  const primarySupplierName =
    (supplierDisplayNames[0] && supplierDisplayNames[0].length
      ? supplierDisplayNames[0]
      : fallbackNameList[0]) ?? "";
  const primarySupplierLogo = derivedPrimaryLogo;
  const packInfo = product.canonical_pack ?? product.pack_sizes?.join(", ") ?? "";
  const brand = product.brand ?? "";
  const hasMultipleSuppliers = supplierIds.length > 1;
  const defaultSupplierId = supplierIds[0] ?? "";
  const defaultSupplierName =
    (supplierDisplayNames[0] && supplierDisplayNames[0].length
      ? supplierDisplayNames[0]
      : supplierIds[0]) ?? supplierLabel;
  const orderedSuppliers = supplierRecords.map(record => ({
    id: record.id,
    name: record.name && record.name.length ? record.name : record.id,
  }));
  const overflowSupplierCount = Math.max(0, supplierCount - 1);

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

  const supportingLine = useMemo(() => {
    if (metaLine) return metaLine;
    if (supplierCount > 0) return supplierLabel;
    return "";
  }, [metaLine, supplierCount, supplierLabel]);

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

    const selectedSupplier = supplierRecords.find(record => record.id === supplierId);
    addItem(
      {
        id: product.catalog_id,
        supplierId,
        supplierName,
        supplierLogoUrl: selectedSupplier?.logo ?? derivedPrimaryLogo ?? null,
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
          className="catalog-card__cta catalog-card__cta--muted h-9"
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
            className="catalog-card__cta catalog-card__cta--primary h-9"
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
          className="catalog-card__cta catalog-card__cta--primary h-9"
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
              className="catalog-card__cta h-9 w-9"
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
        className="catalog-card__cta h-9 w-9"
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
        "catalog-card group isolate flex h-[400px] w-full flex-col overflow-hidden border-0 bg-card shadow-sm",
        "rounded-2xl transition-all duration-200 ease-out hover:shadow-md hover:scale-[1.02]",
        "focus-within:shadow-md focus-within:scale-[1.02]",
        "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-within:scale-100",
        isInCart && "ring-2 ring-primary/20",
        className,
      )}
    >
      <CardContent className="catalog-card__content flex flex-1 flex-col p-0">
        <div className="catalog-card__media relative px-5 pt-5">
          <div className="catalog-card__surface aspect-[4/3] w-full bg-muted/30 rounded-xl overflow-hidden">
            <div className="catalog-card__badge-layer" data-badge-slot>
              {isInCart && (
                <span className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-medium z-10" aria-hidden="true">
                  {cartQuantity}
                </span>
              )}
            </div>
            <div className="catalog-card__image-frame h-full w-full bg-gradient-to-b from-background/50 to-muted/50">
              <img
                src={img}
                alt={product.name}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="catalog-card__image h-full w-full object-cover transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </div>
          </div>
        </div>
        <div className="catalog-card__details flex min-h-[4.25rem] flex-col gap-1.5 px-4 pb-1 pt-4">
          {detailLink ? (
            <a
              {...detailLink}
              title={product.name}
              className="catalog-card__title mb-1 line-clamp-2 tracking-tight"
            >
              {product.name}
            </a>
          ) : (
            <div
              title={product.name}
              className="catalog-card__title mb-1 line-clamp-2 tracking-tight"
            >
              {product.name}
            </div>
          )}
          {supportingLine ? (
            <div className="catalog-card__meta line-clamp-1" title={supportingLine}>
              {supportingLine}
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="catalog-card__footer mt-auto flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-4 pb-4 pt-5">
        <div className="catalog-card__footer-meta flex min-w-0 flex-1 flex-nowrap items-center gap-3 overflow-hidden">
          <AvailabilityBadge
            status={availability}
            updatedAt={product.availability_updated_at}
            className="flex-shrink-0"
          />
          {supplierCount > 0 && (
            <span className="catalog-chip flex min-w-0 items-center gap-2 bg-muted/50 rounded-full px-2 py-1">
              <SupplierLogo
                name={primarySupplierName || supplierLabel}
                logoUrl={primarySupplierLogo}
                className="!h-5 !w-5 flex-shrink-0 !rounded-full bg-background shadow-sm"
              />
              <span
                className="catalog-card__supplier-label truncate text-xs text-muted-foreground"
                title={bestSupplierLabel}
              >
                {bestSupplierLabel}
              </span>
            </span>
          )}
          {overflowSupplierCount > 0 && (
            <span className="catalog-chip bg-muted/50 text-muted-foreground rounded-full px-2 py-1 text-xs flex-shrink-0">
              +{overflowSupplierCount}
            </span>
          )}
          {product.active_supplier_count === 0 && (
            <span className="catalog-chip bg-muted/50 text-muted-foreground rounded-full px-2 py-1 text-xs flex-shrink-0">
              Not seen recently
            </span>
          )}
        </div>
        <div className="catalog-card__footer-actions flex flex-shrink-0 items-center gap-3 md:ml-auto md:pl-4">
          {priceLabel && (
            <div className="catalog-card__price text-sm font-medium tabular-nums" aria-live="polite">
              {priceLabel}
            </div>
          )}
          {renderPrimaryAction()}
        </div>
      </CardFooter>
    </Card>
  );
});

