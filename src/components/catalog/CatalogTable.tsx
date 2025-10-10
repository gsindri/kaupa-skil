import { useState, useRef, useLayoutEffect, useEffect, useCallback, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useVendors } from '@/hooks/useVendors'
import type { Vendor } from '@/hooks/useVendors'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { formatCurrency } from '@/lib/format'
import ProductThumb from '@/components/catalog/ProductThumb'
import SupplierLogo from './SupplierLogo'
import { resolveImage } from '@/lib/images'
import { cn } from '@/lib/utils'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { UnifiedCartControl } from '@/components/cart/UnifiedCartControl'

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
            <TableHead className="w-[220px] px-4 py-3 text-center align-middle">
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
                <TableCell className="w-[220px] px-4 py-2 text-center align-middle">
                  <div className="flex h-full w-full items-center justify-center">
                    <UnifiedCartControl
                      variant="catalog"
                      product={p}
                      suppliers={suppliers.map(s => ({
                        supplier_id: s.supplier_id,
                        supplier_name: s.supplier_name,
                        supplier_logo_url: s.supplier_logo_url,
                      }))}
                      className="flex h-[68%] w-[78%] max-w-[220px] items-stretch justify-center"
                      popoverSide="top"
                      popoverAlign="end"
                    />
                  </div>
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


function PriceCell({
  product,
}: {
  product: any
}) {
  const priceValues: number[] = Array.isArray(product.prices)
    ? product.prices
        .map((p: any) => (typeof p === 'number' ? p : p?.price))
        .filter((p: any) => typeof p === 'number')
    : []
  const detailLink =
    typeof product.sample_source_url === 'string'
      ? product.sample_source_url
      : null

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

  if (typeof product.price_min === 'number' && typeof product.price_max === 'number') {
    const min = product.price_min
    const max = product.price_max
    const text =
      min === max
        ? formatCurrency(min)
        : `${formatCurrency(min)}–${formatCurrency(max)}`
    return <span className="text-sm font-semibold text-foreground">{text}</span>
  }

  if (detailLink) {
    return (
      <a
        href={detailLink}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-medium text-primary hover:underline"
      >
        View supplier details
      </a>
    )
  }

  return <span className="text-sm text-muted-foreground">Price unavailable</span>
}

