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
import { BellRing, Loader2, Lock, Plus } from "lucide-react";

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
      : supplierIds[0]) ?? primarySupplierName;
  const orderedSuppliers = supplierRecords.map(record => ({
    id: record.id,
    name: record.name && record.name.length ? record.name : record.id,
  }));

  const secondaryInfo = useMemo(() => {
    if (packInfo) return packInfo;
    if (brand) return brand;
    return "";
  }, [packInfo, brand]);

  const supplierSummary = useMemo(() => {
    if (supplierCount === 0) return "No suppliers yet";
    if (supplierCount === 1) return primarySupplierName || "Supplier";
    return `${supplierCount} suppliers`;
  }, [primarySupplierName, supplierCount]);

  const availabilityLabel = useMemo(() => {
    return (
      {
        IN_STOCK: "In stock",
        LOW_STOCK: "Low stock",
        OUT_OF_STOCK: "Out of stock",
        UNKNOWN: "Availability unknown",
      } as const
    )[availability];
  }, [availability]);

  const availabilitySummary = useMemo(() => {
    if (product.active_supplier_count === 0 && supplierCount > 0) {
      return "Not seen recently";
    }
    return availabilityLabel;
  }, [availabilityLabel, product.active_supplier_count, supplierCount]);

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
    const buttonClass = "catalog-card__action h-10 w-full justify-center gap-2";
    if (isUnavailable && !isInCart) {
      return (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={buttonClass}
          disabled
          aria-disabled="true"
          title="Out of stock"
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
          <Button asChild variant="outline" size="default" className={buttonClass}>
            <a {...detailLink} aria-label={`See price for ${product.name}`}>
              {content}
            </a>
          </Button>
        );
      }
      return (
        <Button
          type="button"
          variant="outline"
          size="default"
          className={buttonClass}
          disabled
          aria-disabled="true"
        >
          {content}
        </Button>
      );
    }

    if (isInCart && cartItem) {
      return (
        <div className="w-full">
          <CatalogQuantityStepper
            quantity={cartQuantity}
            onChange={qty => updateQuantity(cartItem.supplierItemId, qty)}
            onRemove={() => removeItem(cartItem.supplierItemId)}
            itemLabel={product.name}
            canIncrease={!isUnavailable}
          />
        </div>
      );
    }

    if (hasMultipleSuppliers) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className={buttonClass}
              disabled={isAdding || isUnavailable}
              aria-label={`Choose supplier for ${product.name}`}
              title={isUnavailable ? "Out of stock" : undefined}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Select supplier
                </>
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
        variant="outline"
        size="default"
        className={buttonClass}
        onClick={() => handleAdd(defaultSupplierId, defaultSupplierName)}
        disabled={isAdding || isUnavailable}
        aria-label={`Add ${product.name}`}
        title={isUnavailable ? "Out of stock" : undefined}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </>
        )}
      </Button>
    );
  };

  return (
    <Card
      data-grid-card
      data-in-cart={isInCart ? "true" : undefined}
      className={cn(
        "catalog-card group isolate flex w-full flex-col overflow-hidden border bg-card",
        "rounded-2xl transition-shadow duration-200 ease-out hover:shadow-md focus-within:shadow-md",
        "motion-reduce:transition-none",
        isInCart && "ring-2 ring-primary/20",
        className,
      )}
    >
      <CardContent className="catalog-card__content flex flex-1 flex-col p-0">
        <div className="catalog-card__media relative px-4 pt-4">
          <div className="catalog-card__surface">
            {isInCart && (
              <span className="catalog-card__count-chip" aria-hidden="true">
                {cartQuantity}
              </span>
            )}
            <div className="catalog-card__image-frame">
              <img
                src={img}
                alt={product.name}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                className="catalog-card__image"
              />
            </div>
          </div>
        </div>
        <div className="catalog-card__details flex flex-col gap-2 px-4 pb-2 pt-3">
          {detailLink ? (
            <a {...detailLink} title={product.name} className="catalog-card__title line-clamp-2">
              {product.name}
            </a>
          ) : (
            <div title={product.name} className="catalog-card__title line-clamp-2">
              {product.name}
            </div>
          )}
          {secondaryInfo ? (
            <div className="catalog-card__meta truncate" title={secondaryInfo}>
              {secondaryInfo}
            </div>
          ) : null}
          <AvailabilityBadge
            status={availability}
            updatedAt={product.availability_updated_at}
            className="catalog-card__availability"
          />
          {priceLabel ? (
            <div className="catalog-card__price" aria-live="polite">
              {priceLabel}
            </div>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="catalog-card__footer mt-auto flex w-full flex-col gap-3 px-4 pb-4 pt-4">
        <div className="catalog-card__footer-meta flex w-full items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            {supplierCount === 1 ? (
              <>
                <SupplierLogo
                  name={primarySupplierName || supplierSummary}
                  logoUrl={primarySupplierLogo}
                  className="h-6 w-6 flex-shrink-0 rounded-full border border-border/60 bg-white"
                />
                <span className="truncate" title={primarySupplierName}>
                  {primarySupplierName || supplierSummary}
                </span>
              </>
            ) : (
              <span className="truncate" title={supplierSummary}>
                {supplierSummary}
              </span>
            )}
          </div>
          <span className="whitespace-nowrap" title={availabilitySummary}>
            {availabilitySummary}
          </span>
        </div>
        <div className="catalog-card__footer-actions flex w-full justify-end">
          {renderPrimaryAction()}
        </div>
      </CardFooter>
    </Card>
  );
});
