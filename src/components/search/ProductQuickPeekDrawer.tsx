import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Drawer, DrawerClose, DrawerContent } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { CatalogQuantityStepper } from '@/components/catalog/CatalogQuantityStepper'
import { LazyImage } from '@/components/ui/LazyImage'
import { getCompactCartControlClasses } from '@/components/cart/cartControlStyles'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { useCart } from '@/contexts/useBasket'
import { useCartQuantityController } from '@/contexts/useCartQuantityController'
import type { AvailabilityStatus, PublicCatalogItem } from '@/services/catalog'
import { fetchCatalogItemById } from '@/services/catalog'
import type { SearchItem } from '@/hooks/useGlobalSearch'
import { SupplierLogo } from '@/components/catalog/SupplierLogo'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'

interface ProductQuickPeekDrawerProps {
  open: boolean
  productId: string | null
  item?: SearchItem | null
  onOpenChange: (open: boolean) => void
  onViewDetails?: (productId: string) => void
}

interface SupplierOption {
  id: string
  name: string
  logoUrl?: string | null
}

export function ProductQuickPeekDrawer({
  open,
  productId,
  item,
  onOpenChange,
  onViewDetails,
}: ProductQuickPeekDrawerProps) {
  const { addItem, items: cartItems } = useCart()
  const [product, setProduct] = useState<PublicCatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (!open) {
      setProduct(null)
      setError(null)
      setIsLoading(false)
      setSelectedSupplier(null)
      setIsAdding(false)
      setQuantity(1)
    }
  }, [open])

  useEffect(() => {
    if (!open || !productId) return

    let active = true
    setIsLoading(true)
    setError(null)
    setProduct(null)

    fetchCatalogItemById(productId)
      .then(result => {
        if (!active) return
        setProduct(result)
      })
      .catch(err => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load product details')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, productId])

  const supplierOptions = useMemo(() => {
    const options: SupplierOption[] = []

    const append = (ids: unknown, names: unknown, logos: unknown) => {
      if (!Array.isArray(ids)) return
      ids.forEach((rawId, index) => {
        if (typeof rawId !== 'string' || rawId.length === 0) return
        const existing = options.find(option => option.id === rawId)
        if (existing) return

        let label = rawId
        if (Array.isArray(names)) {
          const candidate = names[index]
          if (typeof candidate === 'string' && candidate.length > 0) {
            label = candidate
          }
        }

        let logoUrl: string | null | undefined
        if (Array.isArray(logos)) {
          const logoCandidate = logos[index]
          if (typeof logoCandidate === 'string' && logoCandidate.length > 0) {
            logoUrl = logoCandidate
          }
        }

        options.push({ id: rawId, name: label, logoUrl })
      })
    }

    append(product?.supplier_ids ?? null, product?.supplier_names ?? null, product?.supplier_logo_urls ?? null)
    append(item?.metadata?.supplierIds ?? null, item?.metadata?.supplierNames ?? null, item?.metadata?.supplierLogos ?? null)

    return options
  }, [
    item?.metadata?.supplierIds,
    item?.metadata?.supplierLogos,
    item?.metadata?.supplierNames,
    product?.supplier_ids,
    product?.supplier_logo_urls,
    product?.supplier_names,
  ])

  useEffect(() => {
    if (!open) return
    if (supplierOptions.length === 0) {
      setSelectedSupplier(null)
      return
    }
    if (!selectedSupplier || !supplierOptions.some(option => option.id === selectedSupplier)) {
      setSelectedSupplier(supplierOptions[0]?.id ?? null)
    }
  }, [open, supplierOptions, selectedSupplier])

  const displayName = product?.name ?? item?.name ?? ''
  const brand = product?.brand ?? item?.metadata?.subtitle ?? null
  const productPackSizes = Array.isArray(product?.pack_sizes)
    ? (product?.pack_sizes as string[]).filter(Boolean)
    : []
  const metadataPackSizes = Array.isArray(item?.metadata?.packSizes)
    ? (item?.metadata?.packSizes as string[]).filter(Boolean)
    : []
  const packSizes = productPackSizes.length > 0 ? productPackSizes : metadataPackSizes
  const canonicalPack = product?.canonical_pack ?? item?.metadata?.canonicalPack ?? null
  const packInfo = canonicalPack ?? (packSizes.length > 0 ? packSizes[0] : null)
  const metadataPrice = item?.metadata?.priceValue
  const priceValue =
    typeof product?.best_price === 'number'
      ? product.best_price
      : typeof metadataPrice === 'number'
        ? metadataPrice
        : null
  const priceLabel =
    priceValue != null
      ? formatCurrency(priceValue)
      : item?.metadata?.price ?? null
  const availabilityStatus = (product?.availability_status ?? item?.metadata?.availabilityStatus ?? null) as
    | AvailabilityStatus
    | null
  const availabilityLabel = product?.availability_text ?? item?.metadata?.availability ?? null
  const imageUrl = product?.sample_image_url ?? item?.metadata?.imageUrl ?? null
  const supplierCount =
    product?.suppliers_count ??
    item?.metadata?.supplierCount ??
    (supplierOptions.length > 0 ? supplierOptions.length : null)

  const totalSuppliers =
    typeof supplierCount === 'number' && supplierCount > 0
      ? supplierCount
      : supplierOptions.length
  const supplierPreview = supplierOptions.slice(0, 3)
  const supplierOverflow = Math.max(0, totalSuppliers - supplierPreview.length)
  const supplierSummaryLabel =
    totalSuppliers > 1
      ? `${totalSuppliers} suppliers`
      : supplierOptions[0]?.name ?? null
  const selectedSupplierOption =
    supplierOptions.find(option => option.id === selectedSupplier) ?? null
  const selectedSupplierName = selectedSupplierOption?.name ?? null

  const cartItemForSelection = useMemo(() => {
    if (!productId) return null
    return (
      cartItems.find(item => {
        if (item.supplierItemId !== productId) return false
        if (!selectedSupplier) return true
        return item.supplierId === selectedSupplier
      }) ?? null
    )
  }, [cartItems, productId, selectedSupplier])

  const fallbackSupplierItemId = useMemo(() => {
    const base = productId ?? item?.id ?? 'quick-peek'
    return `${base}:${selectedSupplier ?? 'default'}`
  }, [item?.id, productId, selectedSupplier])

  const controllerSupplierItemId = cartItemForSelection?.supplierItemId ?? fallbackSupplierItemId
  const controllerQuantity = cartItemForSelection?.quantity ?? 0
  const controller = useCartQuantityController(controllerSupplierItemId, controllerQuantity)
  const hasCartItem = Boolean(cartItemForSelection)

  const effectiveQuantity = hasCartItem ? controller.optimisticQuantity : quantity

  const cartPayload = useMemo(() => {
    if (!productId || !selectedSupplier) {
      return null
    }

    const packSizeLabel = packInfo ?? (packSizes.length ? packSizes.join(', ') : 'Pack')
    const numericPrice = priceValue ?? null

    return {
      id: productId,
      supplierId: selectedSupplier,
      supplierName: selectedSupplierName ?? selectedSupplier,
      itemName: displayName || 'Item',
      sku: productId,
      packSize: packSizeLabel,
      packPrice: numericPrice,
      unitPriceExVat: numericPrice,
      unitPriceIncVat: numericPrice,
      vatRate: 0,
      unit: 'unit',
      supplierItemId: productId,
      displayName: displayName || 'Item',
      packQty: 1,
      image: imageUrl ?? null,
    }
  }, [
    displayName,
    imageUrl,
    packInfo,
    packSizes,
    priceValue,
    productId,
    selectedSupplier,
    selectedSupplierName,
  ])

  const totalPriceLabel =
    priceValue != null ? formatCurrency(priceValue * effectiveQuantity) : null

  const cartControlClasses = useMemo(
    () =>
      getCompactCartControlClasses({
        stepper: 'border border-white/12 bg-white/[0.04] text-[color:var(--text)]',
      }),
    [],
  )

  const additionalPackSizes = packSizes.slice(1)
  const canAddToCart = Boolean(productId && selectedSupplier)

  const handleAddToCart = () => {
    if (hasCartItem) {
      onOpenChange(false)
      return
    }

    if (!cartPayload || isAdding) return
    setIsAdding(true)

    try {
      addItem(cartPayload, effectiveQuantity)
      onOpenChange(false)
    } finally {
      setIsAdding(false)
    }
  }

  const bodyContent = (() => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <div className="h-4 w-3/5 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/6" />
          <div className="h-32 animate-pulse rounded-[12px] bg-white/[0.04]" />
        </div>
      )
    }

    if (error) {
      return <div className="rounded-[12px] bg-red-500/10 px-3 py-3 text-sm text-red-200">{error}</div>
    }

    const detailSections: DetailSectionConfig[] = []

    if (availabilityStatus || availabilityLabel) {
      const hasStatus = Boolean(availabilityStatus)
      const fallbackAvailability = !hasStatus && availabilityLabel ? availabilityLabel : null
      detailSections.push({
        key: 'availability',
        title: 'Availability',
        content: (
          <div
            className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2"
            title={availabilityLabel ?? undefined}
          >
            {hasStatus ? (
              <AvailabilityBadge
                status={availabilityStatus ?? undefined}
                className="!h-7 !rounded-full !px-3 opacity-80"
              />
            ) : fallbackAvailability ? (
              <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-sm font-medium text-[color:var(--text)]">
                {fallbackAvailability}
              </span>
            ) : null}
          </div>
        ),
      })
    }

    if (packInfo || additionalPackSizes.length > 0) {
      detailSections.push({
        key: 'pack',
        title: 'Pack size',
        content: (
          <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-3 text-[color:var(--text)]">
            {packInfo && <div>{packInfo}</div>}
            {additionalPackSizes.length > 0 && (
              <div className="pt-1 text-[12px] text-[color:var(--text-muted)] opacity-80">
                Also available: {additionalPackSizes.join(', ')}
              </div>
            )}
          </div>
        ),
      })
    }

    if (supplierOptions.length > 0) {
      detailSections.push({
        key: 'suppliers',
        title: 'Available from',
        content: (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="flex -space-x-2 opacity-80">
                {supplierPreview.map((option, index) => (
                  <SupplierLogo
                    key={`${option.id}-${index}`}
                    name={option.name}
                    logoUrl={option.logoUrl}
                    className="!h-7 !rounded-full border border-white/10 bg-white/10 opacity-80"
                  />
                ))}
                {supplierOverflow > 0 && (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[11px] font-semibold text-[color:var(--text)] opacity-70">
                    +{supplierOverflow}
                  </span>
                )}
              </div>
              {supplierSummaryLabel && (
                <span className="truncate text-sm font-medium text-[color:var(--text)] opacity-85">
                  {supplierSummaryLabel}
                </span>
              )}
            </div>
            {supplierOptions.length > 1 && selectedSupplierOption && (
              <div className="text-[12px] text-[color:var(--text-muted)]">
                Selected:{' '}
                <span className="font-medium text-[color:var(--text)]">{selectedSupplierOption.name}</span>
              </div>
            )}
            {supplierOptions.length > 1 && (
              <Select value={selectedSupplier ?? undefined} onValueChange={value => setSelectedSupplier(value)}>
                <SelectTrigger className="h-10 rounded-[12px] border border-white/12 bg-white/[0.04] text-[color:var(--text)]">
                  <div className="flex w-full items-center gap-2 text-[color:var(--text)] opacity-90">
                    {selectedSupplierOption && (
                      <SupplierLogo
                        name={selectedSupplierOption.name}
                        logoUrl={selectedSupplierOption.logoUrl}
                        className="!h-6 !rounded-full border border-white/10 bg-white/10 opacity-80"
                      />
                    )}
                    <SelectValue placeholder="Choose supplier" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-[12px] border border-white/10 bg-[color:var(--surface-pop-2)] text-[color:var(--text)]">
                  {supplierOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        <SupplierLogo
                          name={option.name}
                          logoUrl={option.logoUrl}
                          className="!h-5 !rounded-full border border-white/10 bg-white/10 opacity-80"
                        />
                        <span>{option.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ),
      })
    } else {
      detailSections.push({
        key: 'suppliers',
        title: 'Available from',
        content: (
          <div className="rounded-[12px] border border-dashed border-white/12 bg-white/[0.03] px-3 py-3 text-[12px] text-[color:var(--text-muted)]">
            Supplier information will appear once available.
          </div>
        ),
      })
    }

    return (
      <div className="flex flex-col gap-6 text-sm text-[color:var(--text-muted)]">
        {detailSections.map((section, index) => (
          <Fragment key={section.key}>
            <DetailSection title={section.title}>{section.content}</DetailSection>
            {index < detailSections.length - 1 && <SectionDivider />}
          </Fragment>
        ))}
      </div>
    )
  })()

  const addButtonLabel = hasCartItem
    ? 'In cart'
    : effectiveQuantity > 1
      ? `Add ${effectiveQuantity} to cart`
      : 'Add to cart'

  const handleStepperChange = useCallback(
    (next: number) => {
      const numeric = Number.isFinite(next) ? Math.floor(next) : 0
      const bounded = Math.min(999, Math.max(hasCartItem ? 0 : 1, numeric))

      if (hasCartItem) {
        controller.requestQuantity(bounded, {
          addItemPayload: cartPayload ?? undefined,
        })
        return
      }

      if (bounded !== quantity) {
        setQuantity(bounded)
      }
    },
    [cartPayload, controller, hasCartItem, quantity],
  )

  const handleStepperRemove = useCallback(() => {
    if (hasCartItem) {
      controller.remove()
      return
    }

    setQuantity(1)
  }, [controller, hasCartItem])

  useEffect(() => {
    if (!hasCartItem) {
      return
    }
    setIsAdding(false)
  }, [hasCartItem])

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
    >
      <DrawerContent
        side="right"
        showBar={false}
        overlayClassName="bg-[rgba(7,15,25,0.45)] backdrop-blur-[2px] pointer-events-auto"
        className="z-[120] w-full border-l border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] shadow-[0_32px_80px_-48px_rgba(5,12,24,0.85)] sm:max-w-[420px]"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start gap-4 border-b border-white/10 px-6 py-5">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.04]">
              {imageUrl ? (
                <LazyImage
                  src={imageUrl}
                  alt={displayName}
                  loading="lazy"
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[color:var(--text-muted)]">
                  {(displayName || 'P').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="truncate text-[17px] font-semibold text-[color:var(--text)]">{displayName}</h2>
              {brand && <div className="text-sm text-[color:var(--text-muted)]">{brand}</div>}
              {packInfo && (
                <div className="text-sm text-[color:var(--text-muted)]">{packInfo}</div>
              )}
              {priceLabel && (
                <div className="pt-1 text-[16px] font-semibold text-[color:var(--text)]">{priceLabel}</div>
              )}
            </div>
            <DrawerClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
                aria-label="Close quick view"
              >
                ✕
              </button>
            </DrawerClose>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {bodyContent}
          </div>

          <div className="space-y-3 border-t border-white/10 px-6 py-5">
            {priceLabel && (
              <div className="rounded-[12px] border border-white/10 bg-white/[0.03] px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] opacity-80">
                      Price
                    </div>
                    {packInfo && (
                      <div className="text-[12px] text-[color:var(--text-muted)] opacity-80">{packInfo}</div>
                    )}
                  </div>
                  <div className="text-right text-base font-semibold text-[color:var(--text)]">
                    {priceLabel}
                  </div>
                </div>
                {totalPriceLabel && effectiveQuantity > 1 && (
                  <div className="pt-2 text-right text-[12px] text-[color:var(--text-muted)]">
                    Total {totalPriceLabel}
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              <CatalogQuantityStepper
                quantity={effectiveQuantity}
                onChange={handleStepperChange}
                onRemove={handleStepperRemove}
                itemLabel={displayName}
                minQuantity={hasCartItem ? 0 : 1}
                maxQuantity={999}
                canIncrease={hasCartItem ? controller.canIncrease : !isAdding}
                className={cartControlClasses.stepper}
                size="sm"
              />
              <div className="flex-1">
                <Button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || isAdding || hasCartItem}
                  className={cartControlClasses.button}
                >
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : addButtonLabel}
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center rounded-[14px] text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
              disabled={!productId}
              onClick={() => {
                if (productId) {
                  onViewDetails?.(productId)
                }
              }}
            >
              View full details <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

type DetailSectionConfig = {
  key: string
  title: string
  content: ReactNode
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] opacity-80">
        {title}
      </div>
      {children}
    </div>
  )
}

function SectionDivider() {
  return <div className="h-px w-full bg-white/[0.08]" />
}
