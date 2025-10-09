import { memo, useCallback, useEffect, useId, useMemo, useRef, type KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import SupplierLogo from "./SupplierLogo";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { PublicCatalogItem } from "@/services/catalog";
import { resolveImage } from "@/lib/images";
import { useCart } from "@/contexts/useBasket";
import type { CartQuantityController } from "@/contexts/useCartQuantityController";
import { CatalogQuantityStepper } from "./CatalogQuantityStepper";
import { PriceBenchmarkBadge } from "./PriceBenchmarkBadge";
import CatalogAddToCartButton from "./CatalogAddToCartButton";
import {
  CATALOG_ADD_TO_CART_BUTTON_CLASSES,
  CATALOG_ADD_TO_CART_STEPPER_CLASSES,
} from "./catalogAddToCartStyles";
import { Loader2 } from "lucide-react";

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
  const { addItem, items } = useCart();
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
  const defaultSupplierId = supplierIds[0] ?? "";
  const addToCartSuppliers = useMemo(
    () =>
      supplierRecords.map(record => ({
        supplier_id: record.id,
        supplier_name: record.name && record.name.length ? record.name : record.id,
        supplier_logo_url: record.logo,
      })),
    [supplierRecords],
  );

  const supplierSummary = useMemo(() => {
    if (supplierCount === 0) return "No suppliers yet";
    if (supplierCount === 1) return primarySupplierName || "Supplier";
    if (primarySupplierName) {
      return `Best from ${primarySupplierName}`;
    }
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

  const cartQuantity = useMemo(() => {
    let total = 0;
    for (const entry of items) {
      if (entry.supplierItemId === product.catalog_id) {
        total += entry.quantity;
      }
    }
    return total;
  }, [items, product.catalog_id]);

  const isInCart = cartQuantity > 0;


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
  const priceLabel = hasVisiblePrice ? formatCurrency(product.best_price ?? 0) : null;

  const headerSubline = packInfo || brand || "";
  const unitHint = packInfo && brand ? brand : packInfo || brand || "";
  const imageAlt = headerSubline ? `${product.name} – ${headerSubline}` : product.name;
  const sublineText = headerSubline || "\u00A0";

  const availabilityDotClass = cn(
    "size-2 rounded-full",
    {
      "bg-emerald-500": availability === "IN_STOCK",
      "bg-amber-500": availability === "LOW_STOCK",
      "bg-rose-500": availability === "OUT_OF_STOCK",
      "bg-muted": availability === "UNKNOWN",
    },
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      event.preventDefault();
      cartButtonRef.current?.focus();
    },
    [],
  );

  const renderCardStepper = useCallback(
    ({
      controller,
      currentQuantity,
      handleQuantityChange,
      handleRemove,
      maxHint,
      maxQuantity,
      isUnavailable: stepperUnavailable,
      showAddedFeedback,
    }: {
      controller: CartQuantityController;
      currentQuantity: number;
      handleQuantityChange: (value: number) => void;
      handleRemove: () => void;
      maxHint: string | null;
      maxQuantity: number | undefined;
      isUnavailable: boolean;
      showAddedFeedback: boolean;
    }) => (
      <div className="flex w-full flex-col items-end gap-1">
        <div className="relative flex w-full items-center justify-end">
          <CatalogQuantityStepper
            quantity={currentQuantity}
            onChange={handleQuantityChange}
            onRemove={handleRemove}
            itemLabel={`${product.name}`}
            minQuantity={0}
            maxQuantity={maxQuantity}
            canIncrease={
              !stepperUnavailable &&
              (maxQuantity === undefined || currentQuantity < maxQuantity) &&
              controller.canIncrease
            }
            size="sm"
            className={cn(
              CATALOG_ADD_TO_CART_STEPPER_CLASSES.stepper,
              showAddedFeedback && "pointer-events-none opacity-0",
            )}
          />
          {showAddedFeedback ? (
            <div className={CATALOG_ADD_TO_CART_STEPPER_CLASSES.feedbackOverlay}>
              <div
                role="status"
                aria-live="polite"
                className={CATALOG_ADD_TO_CART_STEPPER_CLASSES.feedbackInner}
              >
                Added
                <span aria-hidden className="ml-1 text-base">✓</span>
              </div>
            </div>
          ) : null}
        </div>
        {maxHint ? (
          <span className={CATALOG_ADD_TO_CART_STEPPER_CLASSES.maxHint}>{maxHint}</span>
        ) : null}
      </div>
    ),
    [product.name],
  );

  const addButtonLabel = isAdding ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      <span>Adding…</span>
    </>
  ) : (
    <span>Add</span>
  );


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
        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-shadow duration-200",
        "hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "motion-reduce:transform-none motion-reduce:transition-none",
        isInCart && "ring-1 ring-primary/25",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div
          data-oos={isUnavailable ? "true" : undefined}
          className={cn(
            "relative aspect-square w-full overflow-hidden rounded-xl",
            "grid place-items-center",
            "bg-muted/20",
            "transition-colors duration-200",
            "data-[oos=true]:bg-muted/30",
          )}
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
              "h-full w-full object-contain",
              "transition-transform duration-150",
              "group-hover:translate-y-0.5 group-hover:scale-[1.01]",
              "motion-reduce:transition-none",
              isUnavailable && "grayscale opacity-70",
            )}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          {detailLink ? (
            <a
              {...detailLink}
              id={titleId}
              title={product.name}
              className="line-clamp-1 text-[15px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {product.name}
            </a>
          ) : (
            <h3
              id={titleId}
              title={product.name}
              className="line-clamp-1 text-[15px] font-semibold text-foreground"
            >
              {product.name}
            </h3>
          )}
          <p className="text-[13px] text-muted-foreground">{sublineText}</p>
        </div>
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            {supplierCount === 1 ? (
              <>
                <SupplierLogo
                  name={primarySupplierName || supplierSummary}
                  logoUrl={primarySupplierLogo}
                  className="size-4 flex-shrink-0 rounded-full border border-border/60 bg-white shadow-sm"
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
          </span>
          <span className="inline-flex flex-shrink-0 items-center gap-1">
            <span className={availabilityDotClass} aria-hidden="true" />
            <span className="truncate" title={availabilitySummary}>
              {availabilitySummary}
            </span>
          </span>
        </div>
        <div className="mt-auto w-full">
          <div className="mt-4 border-t border-border pt-3">
            <div
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              aria-live="polite"
            >
              {priceLabel ? (
                <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-foreground tabular-nums">{priceLabel}</span>
                    <PriceBenchmarkBadge
                      supplierId={defaultSupplierId}
                      catalogProductId={product.catalog_id}
                      currentPrice={product.best_price ?? undefined}
                    />
                  </div>
                  {unitHint ? (
                    <span className="text-[12px] text-muted-foreground">{unitHint}</span>
                  ) : null}
                </div>
              ) : allowPrice ? (
                <div className="flex min-w-0 flex-1 items-center gap-1 text-sm text-muted-foreground">
                  Price unavailable
                </div>
              ) : null}
              <div className="flex w-full sm:w-auto sm:flex-shrink-0">
                <CatalogAddToCartButton
                  product={product}
                  suppliers={addToCartSuppliers}
                  className="w-full"
                  buttonClassName={CATALOG_ADD_TO_CART_BUTTON_CLASSES.button}
                  disabledButtonClassName={CATALOG_ADD_TO_CART_BUTTON_CLASSES.disabled}
                  passiveButtonClassName={CATALOG_ADD_TO_CART_BUTTON_CLASSES.passive}
                  unavailableButtonClassName={CATALOG_ADD_TO_CART_BUTTON_CLASSES.unavailable}
                  popoverClassName="w-64 space-y-1 p-2"
                  popoverSide="top"
                  popoverAlign="end"
                  addItemOptions={imageRef.current ? { animateElement: imageRef.current } : undefined}
                  onActionButtonRef={setCartButtonRef}
                  isLoading={isAdding}
                  onAdd={supplierId => {
                    onAdd?.(supplierId);
                  }}
                  buttonLabel={addButtonLabel}
                  renderStepper={renderCardStepper}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

export default ProductCard;
