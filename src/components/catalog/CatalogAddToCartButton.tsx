import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import { Button } from '@/components/ui/button'
import { CatalogQuantityStepper } from '@/components/catalog/CatalogQuantityStepper'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useCart } from '@/contexts/useBasket'
import {
  useCartQuantityController,
  type CartQuantityController,
  type AddItemOptions,
} from '@/contexts/useCartQuantityController'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { resolveImage } from '@/lib/images'
import type { CartItem } from '@/lib/types'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'
import {
  CATALOG_ADD_TO_CART_BUTTON_CLASSES,
  CATALOG_ADD_TO_CART_STEPPER_CLASSES,
} from './catalogAddToCartStyles'

export type CatalogAddToCartSupplier = {
  supplier_id: string
  supplier_name: string
  supplier_logo_url: string | null
}

interface CatalogAddToCartButtonProps {
  product: any
  suppliers?: CatalogAddToCartSupplier[]
  className?: string
  buttonClassName?: string
  disabledButtonClassName?: string
  passiveButtonClassName?: string
  unavailableButtonClassName?: string
  stepperClassName?: string
  popoverClassName?: string
  popoverSide?: 'top' | 'bottom' | 'left' | 'right'
  popoverAlign?: 'start' | 'end' | 'center'
  buttonLabel?: ReactNode
  addItemOptions?: AddItemOptions
  onActionButtonRef?: (node: HTMLButtonElement | null) => void
  isLoading?: boolean
  onAdd?: (supplierId: string) => void
  renderStepper?: (props: {
    controller: CartQuantityController
    currentQuantity: number
    handleQuantityChange: (next: number) => void
    handleRemove: () => void
    showAddedFeedback: boolean
    maxHint: string | null
    maxQuantity: number | undefined
    product: any
    primarySupplierName: string
    isUnavailable: boolean
  }) => ReactNode
}

const DEFAULT_POPOVER_CLASSES = 'w-64 space-y-1 p-2'

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const parseQuantity = (value: unknown): number | null => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return null
  return Math.max(0, Math.floor(numeric))
}

const QUANTITY_CAP_FIELDS = [
  'max_order_qty',
  'max_order_quantity',
  'maxOrderQuantity',
  'maxOrderQty',
  'max_qty',
  'maxQuantity',
  'max_quantity',
  'maximum_quantity',
  'maximumQuantity',
  'maximum_order_quantity',
  'maximumOrderQuantity',
  'order_limit',
  'orderLimit',
  'available_quantity',
  'availableQuantity',
  'quantity_available',
  'stock_quantity',
  'stock_qty',
] as const

const collectQuantityCaps = (source: any): number[] => {
  if (!source) return []

  const normalized = QUANTITY_CAP_FIELDS.map(field => parseQuantity(source?.[field]))
    .filter((value): value is number => value !== null && Number.isFinite(value))
    .map(value => Math.floor(Math.max(0, value)))
    .filter(value => value > 0)

  return normalized
}

export function CatalogAddToCartButton({
  product,
  suppliers,
  className,
  buttonClassName,
  disabledButtonClassName,
  passiveButtonClassName,
  unavailableButtonClassName,
  stepperClassName,
  popoverClassName,
  popoverSide = 'top',
  popoverAlign = 'end',
  buttonLabel = 'Add',
  addItemOptions,
  onActionButtonRef,
  isLoading,
  onAdd,
  renderStepper,
}: CatalogAddToCartButtonProps) {
  const { items } = useCart()
  const existingItem = items.find(
    (i: CartItem) => i.supplierItemId === product.catalog_id,
  )
  const controller = useCartQuantityController(
    existingItem?.supplierItemId ?? product.catalog_id,
    existingItem?.quantity ?? 0,
  )
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [showAddedFeedback, setShowAddedFeedback] = useState(false)
  const previousQuantityRef = useRef(existingItem?.quantity ?? 0)
  const addedFeedbackTimeoutRef = useRef<number | null>(null)

  const availability = (product.availability_status ?? 'UNKNOWN') as
    | 'IN_STOCK'
    | 'LOW_STOCK'
    | 'OUT_OF_STOCK'
    | 'UNKNOWN'
  const isOutOfStock = availability === 'OUT_OF_STOCK'
  const isTemporarilyUnavailable =
    availability === 'UNKNOWN' && (product.active_supplier_count ?? 0) === 0

  const disableAddReason = useMemo(() => {
    const rawReason =
      product?.add_disabled_reason ??
      product?.addDisabledReason ??
      product?.disabled_reason ??
      product?.disabledReason ??
      null
    if (typeof rawReason === 'string') {
      const trimmed = rawReason.trim()
      return trimmed.length ? trimmed : null
    }
    return null
  }, [product])

  const rawSuppliers = useMemo(() => {
    if (product.supplier_products && product.supplier_products.length) {
      return product.supplier_products
    }

    if (product.supplier_ids && product.supplier_names) {
      return product.supplier_ids.map((id: string, idx: number) => ({
        supplier_id: id,
        supplier_name: product.supplier_names[idx] || id,
        is_connected: true,
      }))
    }

    return product.suppliers || []
  }, [product])

  const supplierEntries = useMemo(
    () =>
      rawSuppliers.map((s: any, index: number) => {
        const fallbackLogo = Array.isArray(product.supplier_logo_urls)
          ? product.supplier_logo_urls[index] ?? null
          : null

        if (typeof s === 'string') {
          return {
            id: s,
            name: s,
            connected: true,
            logoUrl: fallbackLogo,
            availability: null,
            updatedAt: null,
          }
        }

        const status =
          s.availability?.status ??
          s.availability_status ??
          s.status ??
          null
        const updatedAt =
          s.availability?.updatedAt ?? s.availability_updated_at ?? null
        const fallbackId =
          s.supplier_id ||
          s.id ||
          s.supplier?.id ||
          product.supplier_ids?.[index] ||
          `supplier-${index}`
        const rawName =
          s.supplier?.name ||
          s.name ||
          s.supplier_name ||
          product.supplier_names?.[index] ||
          null
        const resolvedName = (rawName ?? '').toString().trim() || fallbackId

        return {
          id: fallbackId,
          name: resolvedName,
          connected: s.connected ?? s.supplier?.connected ?? true,
          logoUrl:
            s.logoUrl ||
            s.logo_url ||
            s.supplier?.logo_url ||
            fallbackLogo,
          availability: status,
          updatedAt,
        }
      }),
    [product, rawSuppliers],
  )

  const activeSupplierIndex = useMemo(() => {
    if (existingItem?.supplierId) {
      const index = supplierEntries.findIndex(
        supplier => supplier.id === existingItem.supplierId,
      )
      if (index >= 0) {
        return index
      }
    }

    return supplierEntries.length === 1 ? 0 : -1
  }, [existingItem?.supplierId, supplierEntries])

  const productQuantityCaps = useMemo(
    () => collectQuantityCaps(product),
    [product],
  )

  const productMaxQuantity = useMemo(() => {
    if (!productQuantityCaps.length) return undefined
    return Math.min(...productQuantityCaps)
  }, [productQuantityCaps])

  const maxQuantity = useMemo(() => {
    if (activeSupplierIndex < 0) {
      return productMaxQuantity
    }

    const raw = rawSuppliers[activeSupplierIndex] as any
    if (!raw) {
      return productMaxQuantity
    }

    const supplierCaps = collectQuantityCaps(raw)
    const combinedCaps = [...supplierCaps, ...productQuantityCaps]

    if (!combinedCaps.length) {
      return undefined
    }

    return Math.min(...combinedCaps)
  }, [
    activeSupplierIndex,
    productMaxQuantity,
    productQuantityCaps,
    rawSuppliers,
  ])

  const buildCartItem = useCallback(
    (
      supplier: (typeof supplierEntries)[number],
      index: number,
    ): Omit<CartItem, 'quantity'> => {
      const raw = rawSuppliers[index] as any
      const priceEntry = Array.isArray(product.prices)
        ? product.prices[index]
        : raw?.price ?? raw?.unit_price_ex_vat ?? null
      const priceValue =
        typeof priceEntry === 'number' ? priceEntry : priceEntry?.price ?? null
      const unitPriceExVat = raw?.unit_price_ex_vat ?? priceValue ?? null
      const unitPriceIncVat = raw?.unit_price_inc_vat ?? priceValue ?? null
      const packSize =
        raw?.pack_size || raw?.packSize || product.canonical_pack || ''
      const packQty = raw?.pack_qty ?? 1
      const sku = raw?.sku || raw?.supplier_sku || product.catalog_id
      const unit = raw?.unit || ''
      const supplierName = supplier.name?.trim() || supplier.id || 'Supplier'
      return {
        id: product.catalog_id,
        supplierId: supplier.id,
        supplierName,
        supplierLogoUrl: supplier.logoUrl ?? null,
        itemName: product.name,
        sku,
        packSize,
        packPrice: priceValue,
        unitPriceExVat,
        unitPriceIncVat,
        vatRate: raw?.vat_rate ?? 0,
        unit,
        supplierItemId: product.catalog_id,
        displayName: product.name,
        packQty,
        image: resolveImage(
          product.sample_image_url ?? product.image_main,
          product.availability_status,
        ),
      }
    },
    [product, rawSuppliers, supplierEntries],
  )

  const currentQuantity =
    controller.isPending || controller.optimisticQuantity > 0
      ? controller.optimisticQuantity
      : existingItem?.quantity ?? 0

  const primarySupplierName =
    existingItem?.supplierName ||
    suppliers?.[0]?.supplier_name ||
    supplierEntries[0]?.name ||
    'Supplier'

  useEffect(() => () => {
    if (addedFeedbackTimeoutRef.current) {
      window.clearTimeout(addedFeedbackTimeoutRef.current)
      addedFeedbackTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    const previous = previousQuantityRef.current
    const next = existingItem?.quantity ?? 0
    if (previous === next) {
      return
    }

    if (previous === 0 && next > 0) {
      announceToScreenReader(`Added ${next} × ${product.name} to cart`)
      setShowAddedFeedback(true)
      if (addedFeedbackTimeoutRef.current) {
        window.clearTimeout(addedFeedbackTimeoutRef.current)
      }
      addedFeedbackTimeoutRef.current = window.setTimeout(() => {
        setShowAddedFeedback(false)
        addedFeedbackTimeoutRef.current = null
      }, 300)
    } else if (next === 0 && previous > 0) {
      announceToScreenReader(`Removed ${product.name} from cart`)
      setShowAddedFeedback(false)
      if (addedFeedbackTimeoutRef.current) {
        window.clearTimeout(addedFeedbackTimeoutRef.current)
        addedFeedbackTimeoutRef.current = null
      }
    } else if (next > 0) {
      announceToScreenReader(`Quantity set to ${next} for ${product.name}`)
    }

    previousQuantityRef.current = next
  }, [existingItem?.quantity, product.name])

  useEffect(() => {
    if (currentQuantity > 0) {
      onActionButtonRef?.(null)
    }
  }, [currentQuantity, onActionButtonRef])

  const activeSupplier =
    activeSupplierIndex >= 0 ? supplierEntries[activeSupplierIndex] : null

  const controllerPayload = useMemo(
    () =>
      activeSupplierIndex >= 0 && activeSupplier
        ? buildCartItem(activeSupplier, activeSupplierIndex)
        : null,
    [activeSupplier, activeSupplierIndex, buildCartItem],
  )

  const handleQuantityChange = useCallback(
    (next: number) => {
      const numeric = Number.isFinite(next) ? Math.floor(next) : 0
      const bounded = (() => {
        const clamped = Math.max(0, numeric)
        if (maxQuantity !== undefined) {
          return Math.min(clamped, maxQuantity)
        }
        return clamped
      })()

      controller.requestQuantity(bounded, {
        addItemPayload: controllerPayload ?? undefined,
        addItemOptions: controllerPayload ? addItemOptions : undefined,
      })
    },
    [controller, controllerPayload, maxQuantity, addItemOptions],
  )

  const handleRemove = useCallback(() => {
    controller.remove()
  }, [controller])

  const commitAdd = useCallback(
    (supplierIndex: number) => {
      const supplier = supplierEntries[supplierIndex]
      if (!supplier) return

      onAdd?.(supplier.id)
      controller.requestQuantity(1, {
        addItemPayload: buildCartItem(supplier, supplierIndex),
        addItemOptions,
      })
      if (supplier.availability === 'OUT_OF_STOCK') {
        toast({ description: 'Out of stock at selected supplier.' })
      }
      setIsPickerOpen(false)
    },
    [buildCartItem, controller, supplierEntries, addItemOptions],
  )

  const handleAddAction = useCallback(() => {
    if (supplierEntries.length === 0 || disableAddReason) return
    if (supplierEntries.length === 1) {
      commitAdd(0)
    } else {
      setIsPickerOpen(true)
    }
  }, [commitAdd, disableAddReason, supplierEntries.length])

  const resolvedButtonClasses =
    buttonClassName ?? CATALOG_ADD_TO_CART_BUTTON_CLASSES.button
  const resolvedDisabledClasses =
    disabledButtonClassName ?? CATALOG_ADD_TO_CART_BUTTON_CLASSES.disabled
  const resolvedPassiveClasses =
    passiveButtonClassName ?? CATALOG_ADD_TO_CART_BUTTON_CLASSES.passive
  const resolvedUnavailableClasses =
    unavailableButtonClassName ?? CATALOG_ADD_TO_CART_BUTTON_CLASSES.unavailable
  const resolvedPopoverClasses = popoverClassName ?? DEFAULT_POPOVER_CLASSES

  const maxHint = maxQuantity !== undefined ? `Max ${maxQuantity}` : null

  const renderUnavailableState = () => {
    if (isLoading) {
      return (
        <Button
          ref={onActionButtonRef}
          type="button"
          className={resolvedButtonClasses}
          disabled
          aria-busy="true"
        >
          {buttonLabel}
        </Button>
      )
    }

    if (supplierEntries.length === 0 || isTemporarilyUnavailable) {
      return (
        <Button
          variant="outline"
          className={resolvedUnavailableClasses}
          disabled
        >
          Unavailable
        </Button>
      )
    }

    if (isOutOfStock) {
      return (
        <Button variant="outline" className={resolvedPassiveClasses}>
          Notify me
        </Button>
      )
    }

    if (disableAddReason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex w-full" tabIndex={0} aria-label={disableAddReason}>
              <Button
                type="button"
                className={resolvedDisabledClasses}
                aria-label={`Add ${product.name} to cart. ${disableAddReason}`}
                disabled
              >
                {buttonLabel}
                <span className="sr-only">{disableAddReason}</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-sm">
            {disableAddReason}
          </TooltipContent>
        </Tooltip>
      )
    }

    return null
  }

  const renderAddButton = () => {
    const unavailable = renderUnavailableState()
    if (unavailable) {
      return unavailable
    }

    if (supplierEntries.length === 1) {
      return (
        <Button
          ref={onActionButtonRef}
          type="button"
          className={resolvedButtonClasses}
          onClick={handleAddAction}
          aria-label={`Add ${product.name} to cart`}
          disabled={isLoading}
        >
          {buttonLabel}
        </Button>
      )
    }

    return (
      <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={onActionButtonRef}
            type="button"
            className={resolvedButtonClasses}
            onClick={handleAddAction}
            aria-label={`Add ${product.name} to cart`}
            disabled={isLoading}
          >
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={resolvedPopoverClasses}
          align={popoverAlign}
          side={popoverSide}
          sideOffset={8}
        >
          {supplierEntries.map((s, index) => {
            const initials = s.name
              ? s.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              : '?'
            return (
              <Button
                key={s.id}
                variant="ghost"
                className="w-full justify-start gap-2 px-2 py-1.5 text-sm"
                onClick={() => commitAdd(index)}
              >
                {s.logoUrl ? (
                  <img
                    src={s.logoUrl}
                    alt=""
                    className="size-6 rounded-sm object-contain"
                  />
                ) : (
                  <span className="flex size-6 items-center justify-center rounded-sm bg-muted text-xs font-medium">
                    {initials}
                  </span>
                )}
                <span className="flex-1 truncate text-left">{s.name}</span>
                {s.availability && (
                  <AvailabilityBadge
                    status={s.availability}
                    updatedAt={s.updatedAt}
                  />
                )}
              </Button>
            )
          })}
        </PopoverContent>
      </Popover>
    )
  }

  const defaultStepper = (
    <div className="flex h-full w-full flex-col justify-center gap-1">
      <div className="relative flex h-full w-full items-center justify-center">
        <CatalogQuantityStepper
          className={cn(
            CATALOG_ADD_TO_CART_STEPPER_CLASSES.stepper,
            stepperClassName,
            showAddedFeedback && 'pointer-events-none opacity-0',
          )}
          quantity={currentQuantity}
          onChange={handleQuantityChange}
          onRemove={handleRemove}
          itemLabel={`${product.name} from ${primarySupplierName}`}
          minQuantity={0}
          maxQuantity={maxQuantity}
          canIncrease={
            (maxQuantity === undefined || currentQuantity < maxQuantity) &&
            controller.canIncrease
          }
          size="sm"
        />
        {showAddedFeedback && (
          <div className={CATALOG_ADD_TO_CART_STEPPER_CLASSES.feedbackOverlay}>
            <div
              role="status"
              aria-live="polite"
              className={CATALOG_ADD_TO_CART_STEPPER_CLASSES.feedbackInner}
            >
              Added
              <span aria-hidden className="ml-1 text-base">
                ✓
              </span>
            </div>
          </div>
        )}
      </div>
      {maxHint && (
        <div className={CATALOG_ADD_TO_CART_STEPPER_CLASSES.maxHint}>
          {maxHint}
        </div>
      )}
    </div>
  )

  const content =
    currentQuantity > 0
      ? renderStepper?.({
          controller,
          currentQuantity,
          handleQuantityChange,
          handleRemove,
          showAddedFeedback,
          maxHint,
          maxQuantity,
          product,
          primarySupplierName,
          isUnavailable: isOutOfStock || isTemporarilyUnavailable,
        }) ?? defaultStepper
      : renderAddButton()

  return (
    <div className={cn('flex w-full items-center justify-center', className)}>
      {content}
    </div>
  )
}

export default CatalogAddToCartButton
