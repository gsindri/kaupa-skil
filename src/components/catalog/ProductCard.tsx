import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Card } from "@/components/ui/card";
import SupplierLogo from "./SupplierLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { PublicCatalogItem } from "@/services/catalog";
import { resolveImage } from "@/lib/images";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useCart } from "@/contexts/useBasket";
import type { CartItem } from "@/lib/types";
import { CatalogQuantityStepper } from "./CatalogQuantityStepper";
import { Loader2, Lock, ShoppingCart } from "lucide-react";
import { PriceBenchmarkBadge } from "./PriceBenchmarkBadge";

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
  const titleId = useId();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const setCartButtonRef = useCallback(
    (node: HTMLButtonElement | HTMLAnchorElement | null) => {
      cartButtonRef.current = node;
    },
    [],
  );

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
      { animateElement: imageRef.current ?? undefined },
    );
  };

  const isUnavailable =
    availability === "OUT_OF_STOCK" ||
    (availability === "UNKNOWN" && product.active_supplier_count === 0);

  const detailLink = useMemo(() => {
    if (!product.sample_source_url) return undefined;
    return {
      href: product.sample_source_url,
      target: "_blank" as const,
      rel: "noreferrer" as const,
    };
  }, [product.sample_source_url]);

  const allowPrice = showPrice !== false;
  const hasVisiblePrice = allowPrice && product.best_price != null;
  const isPriceLocked = allowPrice && product.best_price == null;
  const priceLabel = hasVisiblePrice ? formatCurrency(product.best_price ?? 0) : null;

  const headerSubline = packInfo || brand || "";
  const unitHint = packInfo && brand ? brand : packInfo || brand || "";
  const imageAlt = headerSubline ? `${product.name} – ${headerSubline}` : product.name;

  const availabilityDotClass = cn(
    "h-3 w-3 rounded-full border border-white/40 shadow-sm",
    {
      "bg-success": availability === "IN_STOCK",
      "bg-warning": availability === "LOW_STOCK",
      "bg-error": availability === "OUT_OF_STOCK",
      "bg-muted": availability === "UNKNOWN",
    },
  );

  const handleSeePrice = useCallback(() => {
    if (!detailLink) return;
    if (typeof window === "undefined") return;
    const target = detailLink.target ?? "_self";
    const features = target === "_blank" ? "noopener,noreferrer" : undefined;
    window.open(detailLink.href, target, features);
  }, [detailLink]);

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      event.preventDefault();
      cartButtonRef.current?.focus();
    },
    [],
  );

  const renderActionButton = () => {
    const buttonContent = (
      <>
        {isAdding ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        <span>Add</span>
      </>
    );

    if (isPriceLocked) {
      const disabled = !detailLink;
      return (
        <Button
          ref={setCartButtonRef}
          type="button"
          variant="outline"
          size="sm"
          className="h-9 px-3"
          onClick={disabled ? undefined : handleSeePrice}
          disabled={disabled}
          aria-label={
            detailLink
              ? `See price for ${product.name}`
              : `Price unavailable for ${product.name}`
          }
        >
          <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
          See price
        </Button>
      );
    }

    if (hasMultipleSuppliers) {
      return (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={setCartButtonRef}
              type="button"
              size="sm"
              className="h-9 px-3"
              disabled={isAdding || isUnavailable}
              aria-label={`Choose supplier for ${product.name}`}
              title={isUnavailable ? "Out of stock" : undefined}
            >
              {buttonContent}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 space-y-2 p-2" align="end" sideOffset={8}>
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
        ref={setCartButtonRef}
        type="button"
        size="sm"
        className="h-9 px-3"
        onClick={() => handleAdd(defaultSupplierId, defaultSupplierName)}
        disabled={isAdding || isUnavailable}
        aria-label={`Add ${product.name}`}
        title={isUnavailable ? "Out of stock" : undefined}
      >
        {buttonContent}
      </Button>
    );
  };

  return (
    <Card
      data-grid-card
      data-in-cart={isInCart ? "true" : undefined}
      data-unavailable={isUnavailable ? "true" : undefined}
      data-oos={isUnavailable ? "true" : undefined}
      tabIndex={0}
      role="group"
      aria-labelledby={titleId}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "group/card relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/30 bg-card text-left shadow-sm transition-shadow duration-200",
        "hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion-reduce:transform-none motion-reduce:transition-none",
        isInCart && "ring-1 ring-primary/25",
        className,
      )}
    >
      <div className="flex flex-1 flex-col px-3 pb-3 pt-3 md:px-4 md:pb-4 md:pt-4 lg:px-6 lg:pb-6 lg:pt-6">
        <div className="flex min-h-[44px] flex-col gap-1">
          {detailLink ? (
            <a
              {...detailLink}
              id={titleId}
              title={product.name}
              className="line-clamp-1 text-[14px] font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {product.name}
            </a>
          ) : (
            <p
              id={titleId}
              title={product.name}
              className="line-clamp-1 text-[14px] font-medium text-foreground"
            >
              {product.name}
            </p>
          )}
          {headerSubline ? (
            <p className="text-[12px] font-normal text-muted-foreground">{headerSubline}</p>
          ) : (
            <span
              aria-hidden="true"
              className="block text-[12px] text-transparent"
            >
              {"\u00A0"}
            </span>
          )}
        </div>
        <div
          className="relative mt-4 flex aspect-square w-full items-center justify-center rounded-xl bg-[color:var(--panel,#FAFBFC)] p-3 md:p-4 lg:p-6"
        >
          <img
            ref={imageRef}
            src={img}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            draggable={false}
            className={cn(
              "max-h-[75%] w-auto max-w-[92%] object-contain",
              "transition-transform duration-200 ease-out",
              "[filter:var(--product-card-image-filter,drop-shadow(0_2px_6px_rgba(0,0,0,0.08)))]",
              "hover:-translate-y-0.5 hover:scale-[1.01]",
              "motion-reduce:transition-none",
              isUnavailable && "[--product-card-image-filter:grayscale(30%)_opacity(0.7)_drop-shadow(0_2px_6px_rgba(0,0,0,0.08))]",
            )}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            {supplierCount === 1 ? (
              <>
                <SupplierLogo
                  name={primarySupplierName || supplierSummary}
                  logoUrl={primarySupplierLogo}
                  className="h-5 w-5 flex-shrink-0 rounded-full border border-border/60 bg-white shadow-sm"
                />
                <span className="truncate" title={primarySupplierName || supplierSummary}>
                  {primarySupplierName || supplierSummary}
                </span>
              </>
            ) : (
              <span className="truncate" title={supplierSummary}>
                {supplierSummary}
              </span>
            )}
          </div>
          <div className="inline-flex flex-shrink-0 items-center gap-1.5">
            <span className={availabilityDotClass} aria-hidden="true" />
            <span className="truncate" title={availabilitySummary}>
              {availabilitySummary}
            </span>
          </div>
        </div>
        <div className="mt-auto w-full">
          {isUnavailable && !isInCart ? (
            <div className="mt-4 border-t border-border/30 pt-2">
              <Button
                ref={setCartButtonRef}
                type="button"
                variant="outline"
                className="h-9 w-full"
                aria-label={`Notify me when ${product.name} is back`}
              >
                Notify me
              </Button>
            </div>
          ) : (
            <div className="mt-4 border-t border-border/30 pt-2">
              <div className="flex h-12 items-center justify-between gap-3" aria-live="polite">
                {priceLabel ? (
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 text-left">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-semibold text-foreground tabular-nums">{priceLabel}</div>
                      <PriceBenchmarkBadge
                        supplierId={defaultSupplierId}
                        catalogProductId={product.catalog_id}
                        currentPrice={product.best_price ?? undefined}
                      />
                    </div>
                    {unitHint ? (
                      <div className="text-[11px] text-muted-foreground">{unitHint}</div>
                    ) : null}
                  </div>
                ) : (
                  <span className="flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground">
                    {isPriceLocked ? (
                      <>
                        <Lock className="h-4 w-4" aria-hidden="true" />
                        <span>Price locked</span>
                      </>
                    ) : (
                      "Price unavailable"
                    )}
                  </span>
                )}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {isInCart && cartItem ? (
                    <CatalogQuantityStepper
                      quantity={cartQuantity}
                      onChange={qty => updateQuantity(cartItem.supplierItemId, qty)}
                      onRemove={() => removeItem(cartItem.supplierItemId)}
                      itemLabel={product.name}
                      canIncrease={!isUnavailable}
                      className="rounded-lg border border-border/30 bg-background/90 px-2 py-1 shadow-none"
                    />
                  ) : null}
                  {renderActionButton()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

export default ProductCard;
