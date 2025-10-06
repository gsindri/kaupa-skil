import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { CatalogQuantityStepper } from '@/components/catalog/CatalogQuantityStepper'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useVendors } from '@/hooks/useVendors'
import type { Vendor } from '@/hooks/useVendors'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { formatCurrency } from '@/lib/format'
import ProductThumb from '@/components/catalog/ProductThumb'
import SupplierLogo from './SupplierLogo'
import { resolveImage } from '@/lib/images'
import type { CartItem } from '@/lib/types'
import { Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'

type AvailabilityState = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN' | null | undefined

interface SupplierLocationMeta {
  city: string | null
  country: string | null
}

interface SupplierMetadataMaps {
  nameById: Map<string, string>
  logoById: Map<string, string>
  locationById: Map<string, SupplierLocationMeta>
  connectedById: Map<string, boolean>
  availabilityById: Map<string, AvailabilityState>
  fallbackNames: string[]
}

interface SupplierLookupRecord {
  id: string
  name: string | null
  logo_url?: string | null
}

interface SupplierChipInfo {
  supplier_id: string
  supplier_name: string
  supplier_logo_url: string | null
  is_connected: boolean
  availability_state?: AvailabilityState
  location_city?: string | null
  location_country_code?: string | null
}

const ROW_HEIGHT = 62

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const normalizeAvailability = (value: unknown): AvailabilityState => {
  const normalized = normalizeString(value)
  if (!normalized) return null
  if (
    normalized === 'IN_STOCK' ||
    normalized === 'LOW_STOCK' ||
    normalized === 'OUT_OF_STOCK' ||
    normalized === 'UNKNOWN'
  ) {
    return normalized
  }
  return null
}

const gatherSupplierMetadata = (product: any): SupplierMetadataMaps => {
  const nameById = new Map<string, string>()
  const logoById = new Map<string, string>()
  const locationById = new Map<string, SupplierLocationMeta>()
  const connectedById = new Map<string, boolean>()
  const availabilityById = new Map<string, AvailabilityState>()
  const fallbackNames: string[] = []
  const seenNames = new Set<string>()

  const sources = [
    Array.isArray(product?.supplier_products) ? product.supplier_products : [],
    Array.isArray(product?.suppliers) ? product.suppliers : [],
  ]

  for (const entries of sources) {
    for (const rawEntry of entries) {
      if (!rawEntry) continue

      if (typeof rawEntry === 'string') {
        const normalized = normalizeString(rawEntry)
        if (!normalized) continue
        if (!nameById.has(normalized)) {
          nameById.set(normalized, normalized)
        }
        if (!seenNames.has(normalized)) {
          seenNames.add(normalized)
          fallbackNames.push(normalized)
        }
        continue
      }

      const entry: any = rawEntry

      const id =
        normalizeString(entry.supplier_id) ??
        normalizeString(entry.supplierId) ??
        normalizeString(entry.id) ??
        normalizeString(entry.supplier?.id)

      const name =
        normalizeString(entry.supplier_name) ??
        normalizeString(entry.name) ??
        normalizeString(entry.displayName) ??
        normalizeString(entry.supplier?.name)

      const logo =
        normalizeString(entry.logo_url) ??
        normalizeString(entry.logoUrl) ??
        normalizeString(entry.supplier?.logo_url)

      const city =
        normalizeString(entry.location_city) ??
        normalizeString(entry.location?.city) ??
        normalizeString(entry.supplier?.location_city) ??
        normalizeString(entry.supplier?.location?.city)

      const country =
        normalizeString(entry.location_country_code) ??
        normalizeString(entry.location?.country_code) ??
        normalizeString(entry.location?.country) ??
        normalizeString(entry.supplier?.location_country_code) ??
        normalizeString(entry.supplier?.location?.country_code) ??
        normalizeString(entry.supplier?.location?.country)

      const availability =
        normalizeAvailability(entry.availability?.status) ??
        normalizeAvailability(entry.availability_status) ??
        normalizeAvailability(entry.status)

      const connectedValue =
        typeof entry.connected === 'boolean'
          ? entry.connected
          : typeof entry.is_connected === 'boolean'
            ? entry.is_connected
            : typeof entry.supplier?.connected === 'boolean'
              ? entry.supplier.connected
              : null

      if (id) {
        if (name && !nameById.has(id)) {
          nameById.set(id, name)
        }
        if (logo && !logoById.has(id)) {
          logoById.set(id, logo)
        }
        if ((city || country) && !locationById.has(id)) {
          locationById.set(id, {
            city: city ?? null,
            country: country ?? null,
          })
        }
        if (availability && !availabilityById.has(id)) {
          availabilityById.set(id, availability)
        }
        if (connectedValue != null && !connectedById.has(id)) {
          connectedById.set(id, connectedValue)
        }
      }

      if (name && !seenNames.has(name)) {
        seenNames.add(name)
        fallbackNames.push(name)
      }
    }
  }

  return {
    nameById,
    logoById,
    locationById,
    connectedById,
    availabilityById,
    fallbackNames,
  }
}

const buildSupplierChipData = (
  product: any,
  allSuppliers: SupplierLookupRecord[] | undefined,
  vendors: Vendor[],
  connectedSupplierIds: Set<string>,
): SupplierChipInfo[] => {
  const metadata = gatherSupplierMetadata(product)

  const supplierRecords = new Map(
    (allSuppliers ?? []).map(supplier => [supplier.id, supplier]),
  )
  const vendorById = new Map(vendors.map(vendor => [vendor.id, vendor]))
  const vendorByName = new Map(vendors.map(vendor => [vendor.name, vendor]))

  const rawSupplierIds = Array.isArray(product?.supplier_ids)
    ? product.supplier_ids
    : []
  const rawSupplierNames = Array.isArray(product?.supplier_names)
    ? product.supplier_names
    : []
  const rawSupplierLogos = Array.isArray(product?.supplier_logo_urls)
    ? product.supplier_logo_urls
    : []

  const suppliers: SupplierChipInfo[] = []
  const usedIds = new Set<string>()
  const fallbackQueue = metadata.fallbackNames.slice()
  const removeFromQueue = (value: string | null | undefined) => {
    if (!value) return
    const index = fallbackQueue.indexOf(value)
    if (index !== -1) {
      fallbackQueue.splice(index, 1)
    }
  }

  for (let idx = 0; idx < rawSupplierIds.length; idx += 1) {
    const normalizedId = normalizeString(rawSupplierIds[idx])
    if (!normalizedId) continue

    const directName = normalizeString(rawSupplierNames[idx])
    const directLogo = normalizeString(rawSupplierLogos[idx])

    let supplierName = directName && directName !== normalizedId ? directName : null
    let supplierLogo = directLogo ?? null

    const entryName = metadata.nameById.get(normalizedId) ?? null
    const entryLogo = metadata.logoById.get(normalizedId) ?? null
    const entryLocation = metadata.locationById.get(normalizedId)
    const entryConnected = metadata.connectedById.get(normalizedId)
    const entryAvailability = metadata.availabilityById.get(normalizedId)

    if (!supplierName && entryName) {
      supplierName = entryName
    }

    if (!supplierLogo && entryLogo) {
      supplierLogo = entryLogo
    }

    const supplierRecord = supplierRecords.get(normalizedId)
    if ((!supplierName || supplierName === normalizedId) && supplierRecord?.name) {
      supplierName = supplierRecord.name ?? supplierName
    }
    if (!supplierLogo && supplierRecord?.logo_url) {
      const normalizedLogo = normalizeString(supplierRecord.logo_url)
      if (normalizedLogo) supplierLogo = normalizedLogo
    }

    let vendorMatch: Vendor | undefined
    if (!supplierLogo) {
      vendorMatch =
        vendorById.get(normalizedId) ??
        (supplierName ? vendorByName.get(supplierName) : undefined) ??
        (entryName ? vendorByName.get(entryName) : undefined)
      const vendorLogo =
        normalizeString(vendorMatch?.logo_url) ??
        normalizeString(vendorMatch?.logoUrl)
      if (vendorLogo) {
        supplierLogo = vendorLogo
      }
    }

    if ((!supplierName || supplierName === normalizedId) && vendorMatch?.name) {
      supplierName = vendorMatch.name
    }

    if (!supplierName || supplierName === normalizedId) {
      while (fallbackQueue.length) {
        const candidate = fallbackQueue.shift()
        if (!candidate) continue
        supplierName = candidate
        break
      }
    }

    if (!supplierName || supplierName === normalizedId) {
      supplierName =
        entryName ??
        supplierRecord?.name ??
        vendorMatch?.name ??
        normalizedId
    }

    removeFromQueue(supplierName)

    suppliers.push({
      supplier_id: normalizedId,
      supplier_name: supplierName,
      supplier_logo_url: supplierLogo ?? null,
      is_connected: entryConnected ?? connectedSupplierIds.has(normalizedId),
      availability_state: entryAvailability ?? (product.availability_status as AvailabilityState),
      location_city: entryLocation?.city ?? null,
      location_country_code: entryLocation?.country ?? null,
    })
    usedIds.add(normalizedId)
  }

  for (const [id, name] of metadata.nameById) {
    if (!id || usedIds.has(id)) continue

    let supplierName = name
    let supplierLogo = metadata.logoById.get(id) ?? null
    const entryLocation = metadata.locationById.get(id)
    const entryConnected = metadata.connectedById.get(id)
    const entryAvailability = metadata.availabilityById.get(id)

    const supplierRecord = supplierRecords.get(id)
    if ((!supplierName || supplierName === id) && supplierRecord?.name) {
      supplierName = supplierRecord.name ?? supplierName
    }
    if (!supplierLogo && supplierRecord?.logo_url) {
      const normalizedLogo = normalizeString(supplierRecord.logo_url)
      if (normalizedLogo) supplierLogo = normalizedLogo
    }

    const vendorMatch =
      vendorById.get(id) ??
      (supplierName ? vendorByName.get(supplierName) : undefined)
    if (!supplierLogo && vendorMatch) {
      supplierLogo =
        normalizeString(vendorMatch.logo_url) ??
        normalizeString(vendorMatch.logoUrl) ??
        null
    }
    if ((!supplierName || supplierName === id) && vendorMatch?.name) {
      supplierName = vendorMatch.name
    }

    if (!supplierName) {
      while (fallbackQueue.length) {
        const candidate = fallbackQueue.shift()
        if (!candidate) continue
        supplierName = candidate
        break
      }
    }

    if (!supplierName) {
      supplierName = id
    }

    removeFromQueue(supplierName)

    suppliers.push({
      supplier_id: id,
      supplier_name: supplierName,
      supplier_logo_url: supplierLogo ?? null,
      is_connected: entryConnected ?? connectedSupplierIds.has(id),
      availability_state: entryAvailability ?? (product.availability_status as AvailabilityState),
      location_city: entryLocation?.city ?? null,
      location_country_code: entryLocation?.country ?? null,
    })
    usedIds.add(id)
  }

  if (!suppliers.length) {
    fallbackQueue.forEach((name, index) => {
      if (!name) return
      removeFromQueue(name)
      suppliers.push({
        supplier_id: `fallback-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        supplier_name: name,
        supplier_logo_url: null,
        is_connected: false,
        availability_state: product.availability_status as AvailabilityState,
        location_city: null,
        location_country_code: null,
      })
    })
  }

  return suppliers
}

interface CatalogTableProps {
  products: any[]
  sort: { key: 'name' | 'supplier' | 'price' | 'availability'; direction: 'asc' | 'desc' } | null
  onSort: (key: 'name' | 'supplier' | 'price' | 'availability') => void
}

export function CatalogTable({ products, sort, onSort }: CatalogTableProps) {

  const { vendors } = useVendors()
  const { suppliers: allSuppliers } = useSuppliers()
  const { suppliers: connectedSuppliers } = useSupplierConnections()

  const renderSortButton = (
    key: 'name' | 'supplier' | 'price' | 'availability',
    label: string,
    align: 'left' | 'right' = 'left',
    emphasize = false,
  ) => {
    const isActive = sort?.key === key
    const direction = isActive ? sort?.direction : null
    return (
      <button
        type="button"
        key={key}
        aria-pressed={isActive}
        aria-label={`Sort by ${label}${direction ? direction === 'asc' ? ' (ascending)' : ' (descending)' : ''}`}
        onClick={() => onSort(key)}
        className={cn(
          'inline-flex w-full items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:text-slate-300',
          align === 'right'
            ? 'justify-end text-right'
            : 'justify-start text-left',
          (emphasize || isActive) && 'text-slate-900 dark:text-white',
        )}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <span aria-hidden className="text-[10px]">
          {direction ? (direction === 'asc' ? '▲' : '▼') : ''}
        </span>
      </button>
    )
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    const updateMargin = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const next = Math.round(rect.top + window.scrollY)
      if (!Number.isFinite(next)) return
      setScrollMargin(prev => (Math.abs(prev - next) > 1 ? next : prev))
    }

    updateMargin()
    window.addEventListener('resize', updateMargin)

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateMargin)
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }
      if (document.body) {
        resizeObserver.observe(document.body)
      }
    }

    return () => {
      window.removeEventListener('resize', updateMargin)
      resizeObserver?.disconnect()
    }
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: products.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    scrollMargin,
    scrollToFn: (offset, options) => {
      if (typeof window === 'undefined') return
      if (typeof window.scrollTo !== 'function') return
      window.scrollTo({ top: offset, behavior: options?.behavior })
    },
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  const normalizedScrollMargin = Number.isFinite(scrollMargin)
    ? scrollMargin
    : 0
  const firstVirtual = virtualItems[0]
  const lastVirtual = virtualItems[virtualItems.length - 1]
  const contentHeight = Math.max(0, totalSize - normalizedScrollMargin)
  const paddingTop = firstVirtual
    ? Math.max(0, firstVirtual.start - normalizedScrollMargin)
    : 0
  const lastEnd = lastVirtual
    ? Math.max(0, lastVirtual.end - normalizedScrollMargin)
    : 0
  const paddingBottom = Math.max(0, contentHeight - lastEnd)

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card text-foreground shadow-sm dark:border-white/15 dark:bg-[rgba(13,19,32,0.86)]"
    >
      <Table className="min-w-full text-[13px] text-muted-foreground">
        <TableHeader className="sticky top-0 z-10 bg-card/85 backdrop-blur-sm supports-[backdrop-filter]:bg-card/70">
          <TableRow className="border-b border-border/60 dark:border-white/10">
            <TableHead className="px-4 py-3 text-left align-middle">
              {renderSortButton('name', 'Product', 'left', true)}
            </TableHead>
            <TableHead className="w-32 px-4 py-3 text-left align-middle">
              {renderSortButton('availability', 'Availability')}
            </TableHead>
            <TableHead className="w-52 px-4 py-3 text-left align-middle">
              {renderSortButton('supplier', 'Supplier')}
            </TableHead>
            <TableHead className="w-32 px-4 py-3 text-right align-middle">
              {renderSortButton('price', 'Price', 'right')}
            </TableHead>
            <TableHead className="w-[240px] px-4 py-3 text-right align-middle">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Actions
              </span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b-0">
          {paddingTop > 0 && (
            <TableRow aria-hidden className="pointer-events-none border-0">
              <TableCell
                colSpan={5}
                style={{ height: paddingTop, padding: 0, borderBottom: 'none' }}
              />
            </TableRow>
          )}
          {virtualItems.map(virtualRow => {
            const p = products[virtualRow.index]
            const id = p.catalog_id
            const availabilityStatus = (p.availability_status ?? 'UNKNOWN') as AvailabilityState
            const availabilityLabel =
              {
                IN_STOCK: 'In',
                LOW_STOCK: 'Low',
                OUT_OF_STOCK: 'Out',
                UNKNOWN: 'Unknown',
              }[availabilityStatus]

            const connectedSupplierIds = new Set(
              Array.isArray(connectedSuppliers)
                ? connectedSuppliers.map(cs => cs.supplier_id)
                : [],
            )

            const suppliers = buildSupplierChipData(
              p,
              allSuppliers ?? [],
              vendors,
              connectedSupplierIds,
            )

            const primarySupplier = suppliers[0]
            const primarySupplierName = primarySupplier?.supplier_name || 'Unknown supplier'
            const remainingSupplierCount = Math.max(0, suppliers.length - 1)
            const isOutOfStock = availabilityStatus === 'OUT_OF_STOCK'

            return (
              <TableRow
                key={id}
                data-index={virtualRow.index}
                style={{ height: ROW_HEIGHT }}
                className={cn(
                  'group border-b border-border/60 transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 dark:border-white/10 dark:hover:bg-white/10 dark:focus-visible:bg-white/10',
                  virtualRow.index % 2 === 0
                    ? 'bg-background dark:bg-transparent'
                    : 'bg-muted/20 dark:bg-white/5',
                )}
              >
                <TableCell className="px-4 py-2 align-middle">
                  <div className="flex h-full items-center gap-3">
                    <ProductThumb
                      className={cn(
                        'size-14 flex-none overflow-hidden rounded-xl bg-muted/10 transition-opacity duration-150',
                        isOutOfStock && 'opacity-70',
                      )}
                      src={resolveImage(
                        p.sample_image_url ?? p.image_main,
                        p.availability_status,
                      )}
                      name={p.name}
                      brand={p.brand}
                      imageFit="contain"
                    />
                    <div className="min-w-0 space-y-1">
                      <a
                        href={`#${p.catalog_id}`}
                        aria-label={`View details for ${p.name}`}
                        className="line-clamp-1 text-[15px] font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                      >
                        {p.name}
                      </a>
                      {(p.brand || p.canonical_pack) && (
                        <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12.5px] text-muted-foreground">
                          {p.brand && <span className="font-medium text-muted-foreground">{p.brand}</span>}
                          {p.brand && p.canonical_pack && <span aria-hidden>·</span>}
                          {p.canonical_pack && <span>{p.canonical_pack}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-32 px-4 py-2 align-middle text-xs text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AvailabilityBadge
                        tabIndex={-1}
                        status={p.availability_status}
                        updatedAt={p.availability_updated_at}
                        className="h-6 px-2 text-[11px]"
                      />
                    </TooltipTrigger>
                    <TooltipContent className="space-y-1 text-sm">
                      <div>{availabilityLabel}.</div>
                      <div className="text-xs text-muted-foreground">
                        Last checked {p.availability_updated_at ? timeAgo(p.availability_updated_at) : 'unknown'}. Source: {p.suppliers?.[0] || 'Unknown'}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="w-52 px-4 py-2 align-middle">
                  {suppliers.length ? (
                    <div className="flex items-center gap-2">
                      <SupplierLogo
                        name={primarySupplierName}
                        logoUrl={primarySupplier?.supplier_logo_url ?? undefined}
                        className="size-4 flex-none rounded-full border border-border/60 bg-background dark:border-white/20"
                      />
                      <div className="min-w-0 space-y-0.5 text-left">
                        <div className="flex items-center gap-1 text-[13px] font-medium text-foreground">
                          <span className="truncate">{primarySupplierName}</span>
                          {primarySupplier && !primarySupplier.is_connected && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        {remainingSupplierCount > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            +{remainingSupplierCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No supplier data</span>
                  )}
                </TableCell>
                <TableCell className="w-32 px-4 py-2 text-right align-middle">
                  <PriceCell product={p} />
                </TableCell>
                <TableCell className="w-[240px] px-4 py-2 text-right align-middle">
                  <AddToCartButton product={p} suppliers={suppliers} />
                </TableCell>
              </TableRow>
            )
          })}
          {paddingBottom > 0 && (
            <TableRow aria-hidden className="pointer-events-none border-0">
              <TableCell
                colSpan={5}
                style={{ height: paddingBottom, padding: 0, borderBottom: 'none' }}
              />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

  function AddToCartButton({
    product,
    suppliers,
  }: {
    product: any
    suppliers: SupplierChipInfo[]
  }) {
    const { items, addItem, updateQuantity, removeItem } = useCart()
    const existingItem = items.find(
      (i: any) => i.supplierItemId === product.catalog_id,
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

    const supplierEntries = rawSuppliers.map((s: any, index: number) => {
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
    })

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

    const maxQuantity = useMemo(() => {
      const parseQuantity = (value: unknown): number | null => {
        if (typeof value === 'number') {
          return Number.isFinite(value) ? value : null
        }
        if (typeof value === 'string') {
          const parsed = Number.parseFloat(value)
          return Number.isFinite(parsed) ? parsed : null
        }
        return null
      }

      const candidates: Array<number | null> = [
        parseQuantity(product?.max_order_quantity),
        parseQuantity(product?.max_quantity),
        parseQuantity(product?.maximum_quantity),
        parseQuantity(product?.order_limit),
        parseQuantity(product?.available_quantity),
        parseQuantity(product?.available_stock),
        parseQuantity(product?.stock_quantity),
        parseQuantity(product?.stock_qty),
        parseQuantity(product?.quantity_available),
        parseQuantity(product?.max_purchase_quantity),
        parseQuantity(product?.max_purchase_qty),
        parseQuantity(product?.inventory_quantity),
      ]

      if (activeSupplierIndex >= 0) {
        const raw = rawSuppliers[activeSupplierIndex] as any
        candidates.push(
          parseQuantity(raw?.available_quantity),
          parseQuantity(raw?.available_qty),
          parseQuantity(raw?.stock_quantity),
          parseQuantity(raw?.stock_qty),
          parseQuantity(raw?.quantity_available),
          parseQuantity(raw?.max_order_quantity),
          parseQuantity(raw?.maximum_quantity),
          parseQuantity(raw?.order_limit),
        )
      }

      const normalized = candidates
        .filter((value): value is number => value !== null && Number.isFinite(value))
        .map(value => Math.floor(Math.max(0, value)))
        .filter(value => value > 0)

      if (!normalized.length) {
        return undefined
      }

      return Math.min(...normalized)
    }, [activeSupplierIndex, product, rawSuppliers])

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
      [product, rawSuppliers],
    )

    const currentQuantity = existingItem?.quantity ?? 0
    const primarySupplierName =
      existingItem?.supplierName || suppliers[0]?.supplier_name || 'Supplier'

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
        }, 1000)
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

    const handleQuantityChange = useCallback(
      (next: number) => {
        if (!existingItem) return
        const numeric = Number.isFinite(next) ? Math.floor(next) : 0
        const bounded = (() => {
          const clamped = Math.max(0, numeric)
          if (maxQuantity !== undefined) {
            return Math.min(clamped, maxQuantity)
          }
          return clamped
        })()

        if (bounded <= 0) {
          removeItem(existingItem.supplierItemId)
          return
        }

        if (bounded !== existingItem.quantity) {
          updateQuantity(existingItem.supplierItemId, bounded)
        }
      },
      [existingItem, maxQuantity, removeItem, updateQuantity],
    )

    const handleRemove = useCallback(() => {
      if (!existingItem) return
      removeItem(existingItem.supplierItemId)
    }, [existingItem, removeItem])

    const commitAdd = useCallback(
      (supplierIndex: number) => {
        const supplier = supplierEntries[supplierIndex]
        if (!supplier) return

        addItem(buildCartItem(supplier, supplierIndex), 1)
        if (supplier.availability === 'OUT_OF_STOCK') {
          toast({ description: 'Out of stock at selected supplier.' })
        }
        setIsPickerOpen(false)
      },
      [addItem, buildCartItem, supplierEntries],
    )

    const handleAddAction = useCallback(() => {
      if (supplierEntries.length === 0 || disableAddReason) return
      if (supplierEntries.length === 1) {
        commitAdd(0)
      } else {
        setIsPickerOpen(true)
      }
    }, [commitAdd, disableAddReason, supplierEntries.length])

    const controlBaseClasses =
      'h-11 w-full justify-center rounded-full px-4 text-sm font-semibold shadow-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2'
    const addButtonClasses = cn(
      controlBaseClasses,
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    )
    const disabledButtonClasses = cn(
      controlBaseClasses,
      'bg-muted text-muted-foreground shadow-none',
    )
    const passiveButtonClasses = cn(
      controlBaseClasses,
      'border border-border/70 bg-background/80 text-muted-foreground shadow-none backdrop-blur-sm',
    )
    const unavailableButtonClasses = cn(
      controlBaseClasses,
      'border border-dashed border-muted-foreground/60 bg-background/70 text-muted-foreground shadow-none',
    )
    const compactAddButtonClasses =
      'h-9 w-[148px] justify-center rounded-full px-4 text-sm font-semibold shadow-sm'

    if (supplierEntries.length === 0 || isTemporarilyUnavailable) {
      return (
        <div className="flex min-h-[48px] items-center justify-end">
          <div className="inline-flex w-full max-w-[208px] justify-end">
            <Button
              variant="outline"
              className={unavailableButtonClasses}
              disabled
            >
              Unavailable
            </Button>
          </div>
        </div>
      )
    }

    if (isOutOfStock) {
      return (
        <div className="flex min-h-[48px] items-center justify-end">
          <div className="inline-flex w-full max-w-[208px] justify-end">
            <Button
              variant="outline"
              className={passiveButtonClasses}
            >
              Notify me
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={cn(
              compactAddButtonClasses,
              'border-muted-foreground/60 text-muted-foreground shadow-none',
            )}
          >
            Notify me
          </Button>
        </div>
      )
    }

    const maxHint =
      maxQuantity !== undefined ? (
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Max {maxQuantity}
        </span>
      ) : null

    const renderAddButton = () => {
      if (disableAddReason) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex w-full max-w-[208px] justify-end"
                tabIndex={0}
                aria-label={disableAddReason}
              >
                <Button
                  type="button"
                  className={cn(disabledButtonClasses, compactAddButtonClasses)}
                  size="sm"
                  aria-label={`Add ${product.name} to cart. ${disableAddReason}`}
                  disabled
                >
                  Add
                  <span className="sr-only">{disableAddReason}</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm">{disableAddReason}</TooltipContent>
          </Tooltip>
        )
      }

      if (supplierEntries.length === 1) {
        return (
          <Button
            type="button"
            size="sm"
            className={cn(addButtonClasses, compactAddButtonClasses)}
            onClick={handleAddAction}
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </Button>
        )
      }

      return (
        <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              className={cn(addButtonClasses, compactAddButtonClasses)}
              onClick={handleAddAction}
              aria-label={`Add ${product.name} to cart`}
            >
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 space-y-1 p-2" align="end" side="top">
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
                  {!s.connected && <Lock className="h-4 w-4" />}
                </Button>
              )
            })}
          </PopoverContent>
        </Popover>
      )
    }

    const stepper = (
      <div className="flex w-full flex-col items-end gap-1.5">
        <CatalogQuantityStepper
          className="w-[148px] shadow-sm"
          quantity={currentQuantity}
          onChange={handleQuantityChange}
          onRemove={handleRemove}
          itemLabel={`${product.name} from ${primarySupplierName}`}
          minQuantity={0}
          maxQuantity={maxQuantity}
          canIncrease={maxQuantity === undefined || currentQuantity < maxQuantity}
          size="sm"
        />
        {maxHint}
      </div>
    )

    const addedFeedback = (
      <div
        role="status"
        aria-live="polite"
        className="flex h-11 w-full items-center justify-center rounded-full border border-emerald-300/60 bg-emerald-500/10 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur-sm dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200"
      >
        Added
        <span aria-hidden className="ml-1 text-base">
          ✓
        </span>
      </div>
    )

    return (
      <div className="flex min-h-[48px] items-center justify-end">
        <div className="inline-flex w-full max-w-[208px] justify-end">
          {currentQuantity > 0 ? (
            showAddedFeedback ? addedFeedback : stepper
          ) : (
            renderAddButton()
          )}
        </div>
      </div>
    )
  }

function PriceCell({
  product,
}: {
  product: any
}) {
  const sources: string[] =
    product.price_sources ||
    (Array.isArray(product.suppliers)
      ? product.suppliers.map((s: any) =>
          typeof s === 'string' ? s : s.name || s.supplier_name || '',
        )
      : Array.isArray(product.supplier_names)
        ? product.supplier_names
        : [])
  const priceValues: number[] = Array.isArray(product.prices)
    ? product.prices
        .map((p: any) => (typeof p === 'number' ? p : p?.price))
        .filter((p: any) => typeof p === 'number')
    : []
  const isLocked = product.prices_locked ?? product.price_locked ?? false
  const detailLink =
    typeof product.sample_source_url === 'string'
      ? product.sample_source_url
      : null

  if (isLocked) {
    const linkNode = detailLink ? (
      <a
        href={detailLink}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-primary hover:underline"
      >
        See price
      </a>
    ) : (
      <span className="text-sm font-medium text-primary">See price</span>
    )

    const content = (
      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" aria-hidden="true" />
        {linkNode}
      </div>
    )

    if (sources.length) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent className="space-y-1">
            {sources.map(source => (
              <div key={source}>{`Connect ${source} to unlock pricing.`}</div>
            ))}
          </TooltipContent>
        </Tooltip>
      )
    }

    return content
  }

  if (priceValues.length) {
    priceValues.sort((a, b) => a - b)
    const min = priceValues[0]
    const max = priceValues[priceValues.length - 1]
    const currency =
      (Array.isArray(product.prices) && product.prices[0]?.currency) || 'ISK'
    const text =
      min === max
        ? formatCurrency(min, currency)
        : `${formatCurrency(min, currency)}–${formatCurrency(max, currency)}`

    return (
      <div className="flex items-center justify-end gap-2">
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {text}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Price unavailable</span>
    </div>
  )
}

