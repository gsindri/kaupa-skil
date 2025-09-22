import { useEffect, useMemo, useState } from 'react'
import { Drawer, DrawerClose, DrawerContent } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LazyImage } from '@/components/ui/LazyImage'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpRight, Loader2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'
import { useCart } from '@/contexts/useBasket'
import type { AvailabilityStatus, PublicCatalogItem } from '@/services/catalog'
import { fetchCatalogItemById } from '@/services/catalog'
import type { SearchItem } from '@/hooks/useGlobalSearch'
import { SupplierLogo } from '@/components/catalog/SupplierLogo'

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
  const { addItem } = useCart()
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
  const availabilityClasses = getAvailabilityTone(availabilityStatus)
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

  const additionalPackSizes = packSizes.slice(1)
  const canAddToCart = Boolean(productId && selectedSupplier)
  const handleAddToCart = () => {
    if (!productId || !selectedSupplier || isAdding) return
    setIsAdding(true)

    try {
      const packSizeLabel = packInfo ?? (packSizes.length ? packSizes.join(', ') : 'Pack')
      const numericPrice = priceValue ?? null

      addItem(
        {
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
        },
        quantity,
      )
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

    return (
      <div className="space-y-4 text-sm text-[color:var(--text-muted)]">
        {availabilityLabel && (
          <div className="flex items-center gap-2">
            <span className="font-medium text-[color:var(--text)]">Availability</span>
            <Badge className={cn('text-xs font-medium', availabilityClasses)}>{availabilityLabel}</Badge>
          </div>
        )}

        {packInfo && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] opacity-80">
              Pack size
            </div>
            <div className="text-[color:var(--text)]">{packInfo}</div>
            {additionalPackSizes.length > 0 && (
              <div className="text-[12px] text-[color:var(--text-muted)]">
                Also available: {additionalPackSizes.join(', ')}
              </div>
            )}
          </div>
        )}

        {supplierOptions.length > 0 ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] opacity-80">
                Available from
              </div>
              <div className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="flex -space-x-2">
                  {supplierPreview.map((option, index) => (
                    <SupplierLogo
                      key={`${option.id}-${index}`}
                      name={option.name}
                      logoUrl={option.logoUrl}
                      className="!h-7 !w-7 !rounded-full border border-white/10 bg-white/10"
                    />
                  ))}
                  {supplierOverflow > 0 && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[11px] font-semibold text-[color:var(--text)]">
                      +{supplierOverflow}
                    </span>
                  )}
                </div>
                {supplierSummaryLabel && (
                  <span className="truncate text-sm font-medium text-[color:var(--text)]">
                    {supplierSummaryLabel}
                  </span>
                )}
              </div>
              {supplierOptions.length > 1 && selectedSupplierOption && (
                <div className="text-[12px] text-[color:var(--text-muted)]">
                  Selected:{' '}
                  <span className="font-medium text-[color:var(--text)]">
                    {selectedSupplierOption.name}
                  </span>
                </div>
              )}
            </div>

            {supplierOptions.length > 1 && (
              <Select value={selectedSupplier ?? undefined} onValueChange={value => setSelectedSupplier(value)}>
                <SelectTrigger className="h-10 rounded-[12px] border border-white/12 bg-white/[0.04] text-[color:var(--text)]">
                  <div className="flex w-full items-center gap-2 text-[color:var(--text)]">
                    {selectedSupplierOption && (
                      <SupplierLogo
                        name={selectedSupplierOption.name}
                        logoUrl={selectedSupplierOption.logoUrl}
                        className="!h-6 !w-6 !rounded-full border border-white/10 bg-white/10"
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
                          className="!h-5 !w-5 !rounded-full border border-white/10 bg-white/10"
                        />
                        <span>{option.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-white/12 bg-white/[0.04] px-3 py-3 text-[12px] text-[color:var(--text-muted)]">
            Supplier information will appear once available.
          </div>
        )}
      </div>
    )
  })()

  const addButtonLabel = quantity > 1 ? `Add ${quantity} to cart` : 'Add to cart'
  const canDecreaseQuantity = quantity > 1 && !isAdding
  const canIncreaseQuantity = quantity < 999 && !isAdding

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
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-full border border-white/12 bg-white/[0.04] px-1.5">
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center text-[color:var(--text)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={!canDecreaseQuantity}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] text-center text-sm font-semibold text-[color:var(--text)]">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center text-[color:var(--text)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setQuantity(prev => Math.min(999, prev + 1))}
                  disabled={!canIncreaseQuantity}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                type="button"
                onClick={handleAddToCart}
                disabled={!canAddToCart || isAdding}
                className="h-11 flex-1 rounded-[14px]"
              >
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : addButtonLabel}
              </Button>
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

function getAvailabilityTone(status: AvailabilityStatus | null): string {
  switch (status) {
    case 'IN_STOCK':
      return 'bg-emerald-500/15 text-emerald-300'
    case 'LOW_STOCK':
      return 'bg-amber-500/15 text-amber-200'
    case 'OUT_OF_STOCK':
      return 'bg-red-500/15 text-red-200'
    default:
      return 'bg-white/10 text-[color:var(--text-muted)]'
  }
}
