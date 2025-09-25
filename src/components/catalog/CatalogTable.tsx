import { useRef, useState, isValidElement } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
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
  selected: string[]
  onSelect: (id: string) => void
  onSelectAll: (checked: boolean) => void
  sort: { key: 'name' | 'supplier' | 'price' | 'availability'; direction: 'asc' | 'desc' } | null
  onSort: (key: 'name' | 'supplier' | 'price' | 'availability') => void
  isBulkMode: boolean
}

export function CatalogTable({
  products,
  selected,
  onSelect,
  onSelectAll,
  sort,
  onSort,
  isBulkMode,
}: CatalogTableProps) {
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

  const { vendors } = useVendors()
  const { suppliers: allSuppliers } = useSuppliers()
  const { suppliers: connectedSuppliers } = useSupplierConnections()

  const allIds = products.map(p => p.catalog_id)
  const isAllSelected = allIds.length > 0 && allIds.every(id => selected.includes(id))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number, id: string) => {
    if (e.key === 'ArrowDown') {
      rowRefs.current[index + 1]?.focus()
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      rowRefs.current[index - 1]?.focus()
      e.preventDefault()
    } else if (e.key === ' ') {
      onSelect(id)
      e.preventDefault()
    }
  }

  const renderSortButton = (
    key: 'name' | 'supplier' | 'price' | 'availability',
    label: string,
    align: 'left' | 'right' = 'left',
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
          isActive && 'text-slate-900 dark:text-white',
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

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/70 bg-white text-slate-900 dark:border-white/10 dark:bg-[rgba(13,19,32,0.86)] dark:text-slate-100">
      <Table className="min-w-full text-sm text-slate-600 dark:text-slate-300">
        <TableHeader className="sticky top-0 z-10 bg-slate-50/70 backdrop-blur-sm dark:bg-white/5">
          <TableRow className="border-b border-slate-200/70 bg-transparent dark:border-white/10">
            {isBulkMode && (
              <TableHead className="w-12 px-4 py-3 text-left align-middle">
                <Checkbox
                  aria-label="Select all products"
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="px-4 py-3 text-left align-middle">
              {renderSortButton('name', 'Product')}
            </TableHead>
            <TableHead className="w-40 px-4 py-3 text-left align-middle">
              {renderSortButton('availability', 'Availability')}
            </TableHead>
            <TableHead className="px-4 py-3 text-left align-middle">
              {renderSortButton('supplier', 'Supplier')}
            </TableHead>
            <TableHead className="w-32 px-4 py-3 text-right align-middle">
              {renderSortButton('price', 'Price', 'right')}
            </TableHead>
            <TableHead className="w-32 px-4 py-3 text-right align-middle text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:last-child]:border-b-0">
          {products.map((p, i) => {
            const id = p.catalog_id
            const isSelected = selected.includes(id)
            const availabilityLabel =
              {
                IN_STOCK: 'In',
                LOW_STOCK: 'Low',
                OUT_OF_STOCK: 'Out',
                UNKNOWN: 'Unknown',
              }[p.availability_status ?? 'UNKNOWN']

            const connectedSupplierIds = new Set(
              connectedSuppliers?.map(cs => cs.supplier_id) ?? [],
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

            return (
              <TableRow
                key={id}
                ref={el => (rowRefs.current[i] = el)}
                tabIndex={-1}
                data-state={isSelected ? 'selected' : undefined}
                onKeyDown={e => handleKeyDown(e, i, id)}
                className="group border-b border-slate-200/60 bg-white transition-colors hover:bg-slate-50 focus-visible:bg-slate-100 data-[state=selected]:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:focus-visible:bg-white/15 dark:data-[state=selected]:bg-white/12"
              >
                {isBulkMode && (
                  <TableCell className="w-12 px-4 py-3 align-middle">
                    <Checkbox
                      aria-label={`Select ${p.name}`}
                      checked={isSelected}
                      onCheckedChange={() => onSelect(id)}
                    />
                  </TableCell>
                )}
                <TableCell className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-3">
                    <ProductThumb
                      className="h-12 w-12 flex-none overflow-hidden rounded-md border border-slate-200/80 bg-white object-cover dark:border-white/15 dark:bg-white/10"
                      src={resolveImage(
                        p.sample_image_url ?? p.image_main,
                        p.availability_status,
                      )}
                      name={p.name}
                      brand={p.brand}
                    />
                    <div className="min-w-0">
                      <a
                        href={`#${p.catalog_id}`}
                        aria-label={`View details for ${p.name}`}
                        className="truncate text-sm font-semibold text-slate-900 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:text-white dark:hover:text-slate-200"
                      >
                        {p.name}
                      </a>
                      {(p.brand || p.canonical_pack) && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-muted-foreground">
                          {p.brand && <span className="font-medium">{p.brand}</span>}
                          {p.brand && p.canonical_pack && <span aria-hidden>·</span>}
                          {p.canonical_pack && (
                            <span className="font-medium text-slate-600 dark:text-slate-200">
                              {p.canonical_pack}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="w-40 px-4 py-3 align-middle">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AvailabilityBadge
                        tabIndex={-1}
                        status={p.availability_status}
                        updatedAt={p.availability_updated_at}
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
                <TableCell className="px-4 py-3 align-middle">
                  {suppliers.length ? (
                    <div className="flex items-center gap-3">
                      <SupplierLogo
                        name={primarySupplierName}
                        logoUrl={primarySupplier?.supplier_logo_url ?? undefined}
                        className="!h-8 !w-8 flex-none !rounded-md border border-slate-200/70 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-white/10"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                          <span className="truncate">{primarySupplierName}</span>
                          {primarySupplier && !primarySupplier.is_connected && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        {remainingSupplierCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            +{remainingSupplierCount} more
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No supplier data</span>
                  )}
                </TableCell>
                <TableCell className="w-32 px-4 py-3 text-right align-middle">
                  <PriceCell product={p} />
                </TableCell>
                <TableCell className="w-32 px-4 py-3 text-right align-middle">
                  <AddToCartButton product={p} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

  function AddToCartButton({
    product,
    className,
  }: {
    product: any
    className?: string
  }) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const existingItem = items.find(
    (i: any) => i.supplierItemId === product.catalog_id,
  )

  const [open, setOpen] = useState(false)

  const availability = (product.availability_status ?? 'UNKNOWN') as
    | 'IN_STOCK'
    | 'LOW_STOCK'
    | 'OUT_OF_STOCK'
    | 'UNKNOWN'
  const isUnavailable =
    availability === 'OUT_OF_STOCK' ||
    (availability === 'UNKNOWN' &&
      (product.active_supplier_count ?? 0) === 0)

  const rawSuppliers =
    (product.supplier_products && product.supplier_products.length
      ? product.supplier_products
      : product.supplier_ids && product.supplier_names
        ? product.supplier_ids.map((id: string, idx: number) => ({
            supplier_id: id,
            supplier_name: product.supplier_names[idx] || id,
            is_connected: true,
          }))
        : product.suppliers) || []

  const supplierEntries = rawSuppliers.map((s: any) => {
    if (typeof s === 'string') {
      return { id: s, name: s, connected: true }
    }
    const status =
      s.availability?.status ??
      s.availability_status ??
      s.status ??
      null
    const updatedAt =
      s.availability?.updatedAt ?? s.availability_updated_at ?? null
    return {
      id: s.supplier_id || s.id || s.supplier?.id,
      name: s.supplier?.name || s.name,
      connected: s.connected ?? s.supplier?.connected ?? true,
      logoUrl:
        s.logoUrl || s.logo_url || s.supplier?.logo_url || null,
      availability: status,
      updatedAt,
    }
  })

  const buildCartItem = (
    supplier: (typeof supplierEntries)[number],
    index: number
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
    return {
      id: product.catalog_id,
      supplierId: supplier.id,
      supplierName: supplier.name ?? '',
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
        product.availability_status
      )
    }
  }

  const slotClasses = cn('flex justify-end', className)
  const actionButtonClasses = 'h-10 justify-center rounded-full px-4 text-sm font-semibold shadow-[0_14px_28px_-18px_rgba(15,23,42,0.35)] transition-shadow hover:shadow-[0_18px_36px_-16px_rgba(15,23,42,0.4)] dark:shadow-[0_14px_28px_-18px_rgba(3,10,26,0.55)] dark:hover:shadow-[0_20px_38px_-16px_rgba(3,10,26,0.6)]'

  if (existingItem)
    return (
      <div className={slotClasses}>
        <QuantityStepper
          className="w-auto"
          quantity={existingItem.quantity}
          onChange={qty =>
            updateQuantity(existingItem.supplierItemId, qty)
          }
          onRemove={() => removeItem(existingItem.supplierItemId)}
          label={product.name}
          supplier={existingItem.supplierName}
        />
      </div>
    )

  if (supplierEntries.length === 0) return null

  if (isUnavailable) {
    return (
      <div className={slotClasses}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex w-full cursor-not-allowed">
              <Button
                size="default"
                disabled
                aria-disabled="true"
                aria-label={`Add ${product.name} to cart`}
                className={cn(
                  actionButtonClasses,
                  'pointer-events-none bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400',
                )}
              >
                Add
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Out of stock</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  if (supplierEntries.length === 1) {
    const s = supplierEntries[0]
    return (
      <div className={slotClasses}>
        <Button
          size="default"
          className={actionButtonClasses}
          onClick={() => {
            addItem(buildCartItem(s, 0))
            if (s.availability === 'OUT_OF_STOCK') {
              toast({ description: 'Out of stock at selected supplier.' })
            }
          }}
          aria-label={`Add ${product.name} to cart`}
        >
          Add
        </Button>
      </div>
    )
  }
  return (
    <div className={slotClasses}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="default"
            className={actionButtonClasses}
            aria-label={`Add ${product.name} to cart`}
          >
            Add
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-1 p-2">
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
                className="w-full justify-start gap-2 px-2"
                onClick={() => {
                  addItem(buildCartItem(s, index))
                  if (s.availability === 'OUT_OF_STOCK') {
                    toast({ description: 'Out of stock at selected supplier.' })
                  }
                  setOpen(false)
                }}
              >
                {s.logoUrl ? (
                  <img
                    src={s.logoUrl}
                    alt=""
                    className="h-6 w-6 rounded-sm"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-xs font-medium">
                    {initials}
                  </span>
                )}
                <span className="flex-1 text-left">{s.name}</span>
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

  const fallbackPriceNode = (
    <span className="tabular-nums">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Price unavailable</span>
    </span>
  )

  let priceNode: React.ReactNode = fallbackPriceNode
  let tooltip: React.ReactNode | null = null

  if (isLocked) {
    priceNode = (
      <div className="flex items-center justify-end gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span aria-hidden="true" className="tabular-nums">
          —
        </span>
        <span className="sr-only">Price locked</span>
      </div>
    )
    if (sources.length) {
      tooltip = (
        <>
          {sources.map((s: string) => (
            <div key={s}>{`Connect ${s} to see price.`}</div>
          ))}
        </>
      )
    }
  } else if (priceValues.length) {
    priceValues.sort((a, b) => a - b)
    const min = priceValues[0]
    const max = priceValues[priceValues.length - 1]
    const currency =
      (Array.isArray(product.prices) && product.prices[0]?.currency) || 'ISK'
    const text =
      min === max
        ? formatCurrency(min, currency)
        : `${formatCurrency(min, currency)}–${formatCurrency(max, currency)}`
    priceNode = <span className="tabular-nums">{text}</span>
  } else {
    priceNode = (
      <span className="tabular-nums">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No supplier data</span>
      </span>
    )
    tooltip = 'No supplier data'
  }

  const triggerNode = isValidElement(priceNode)
    ? priceNode
    : fallbackPriceNode

  const priceContent = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{triggerNode}</TooltipTrigger>
      <TooltipContent className="space-y-1">{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    triggerNode
  )

  return (
    <div className="flex items-center justify-end gap-2">
      {priceContent}
    </div>
  )
}

