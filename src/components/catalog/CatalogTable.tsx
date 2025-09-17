import { useRef, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useVendors } from '@/hooks/useVendors'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { formatCurrency } from '@/lib/format'
import type { FacetFilters } from '@/services/catalog'
import ProductThumb from '@/components/catalog/ProductThumb'
import SupplierLogo from './SupplierLogo'
import SupplierChips from './SupplierChips'
import { resolveImage } from '@/lib/images'
import type { CartItem } from '@/lib/types'
import { Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { useSuppliers } from '@/hooks/useSuppliers'

interface CatalogTableProps {
  products: any[]
  selected: string[]
  onSelect: (id: string) => void
  onSelectAll: (checked: boolean) => void
  sort: { key: 'name' | 'supplier' | 'price' | 'availability'; direction: 'asc' | 'desc' } | null
  onSort: (key: 'name' | 'supplier' | 'price' | 'availability') => void
  filters: FacetFilters
  onFilterChange: (f: Partial<FacetFilters>) => void
  isBulkMode: boolean
}

export function CatalogTable({
  products,
  selected,
  onSelect,
  onSelectAll,
  sort,
  onSort,
  filters,
  onFilterChange,
  isBulkMode,
}: CatalogTableProps) {
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

  const { vendors } = useVendors()
  const { suppliers: allSuppliers } = useSuppliers()
  const { suppliers: connectedSuppliers } = useSupplierConnections()
  const brandValues = filters.brand ?? []
  const brandOptions = Array.from(
    new Set(products.map(p => p.brand).filter(Boolean) as string[]),
  ).sort()
  const showBrandFilter =
    products.length > 0 &&
    products.filter(p => p.brand).length / products.length > 0.3

  const showFilterRow = showBrandFilter

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

  return (
    <div className="group/catalog-table mt-4 rounded-[var(--r-card,20px)] bg-[color:var(--surface-raised)] ring-1 ring-inset ring-white/12 shadow-[0_28px_64px_rgba(3,10,26,0.5)] backdrop-blur-xl">
      <Table className="min-w-full text-sm text-[color:var(--ink)]">
        <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-raised-strong)] backdrop-blur-xl shadow-[0_12px_26px_rgba(3,10,26,0.45)] [&_tr]:border-0">
          <TableRow>
            {isBulkMode && (
              <TableHead className="w-8 px-3 text-[color:var(--ink-dim)]/70">
                <Checkbox
                  aria-label="Select all products"
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
            )}
            <TableHead className="w-10 px-3 text-[color:var(--ink-dim)]/70">Image</TableHead>
            <TableHead
              className="[width:minmax(0,1fr)] cursor-pointer select-none px-3 text-[color:var(--ink-dim)]/70"
              onClick={() => onSort('name')}
            >
              Name {sort?.key === 'name' && (sort?.direction === 'asc' ? '▲' : '▼')}
            </TableHead>
            <TableHead
              className="w-[120px] cursor-pointer select-none px-3 text-center text-[color:var(--ink-dim)]/70"
              onClick={() => onSort('availability')}
            >
              Availability {sort?.key === 'availability' && (sort?.direction === 'asc' ? '▲' : '▼')}
            </TableHead>
            <TableHead
              className="w-[136px] cursor-pointer select-none px-3 text-right text-[color:var(--ink-dim)]/70"
              onClick={() => onSort('price')}
            >
              Price {sort?.key === 'price' && (sort?.direction === 'asc' ? '▲' : '▼')}
            </TableHead>
            <TableHead
              className="w-[220px] min-w-[180px] max-w-[220px] cursor-pointer select-none px-3 text-[color:var(--ink-dim)]/70"
              onClick={() => onSort('supplier')}
            >
              Suppliers {sort?.key === 'supplier' && (sort?.direction === 'asc' ? '▲' : '▼')}
            </TableHead>
          </TableRow>
          {showFilterRow && (
            <TableRow className="bg-white/5">
              {isBulkMode && <TableHead className="px-3" />}
              <TableHead className="px-3" />
              <TableHead className="px-3">
                {showBrandFilter && (
                  <Select
                    value={brandValues[0] ?? 'all'}
                    onValueChange={v =>
                      onFilterChange({ brand: v === 'all' ? undefined : [v] })
                    }
                  >
                    <SelectTrigger className="h-8 rounded-[var(--ctrl-r,12px)] bg-white/10 text-xs text-[color:var(--ink-dim)]/80 ring-1 ring-inset ring-white/15 focus:ring-0">
                      <SelectValue placeholder="Brand" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[16px] bg-[color:var(--field-bg-elev)] text-[color:var(--ink)] ring-1 ring-inset ring-white/12 backdrop-blur-xl">
                      <SelectItem value="all">All</SelectItem>
                      {brandOptions.map(b => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableHead>
              <TableHead className="px-3" />
              <TableHead className="w-[136px] px-3" />
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
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

            return (
              <TableRow
                key={id}
                ref={el => (rowRefs.current[i] = el)}
                tabIndex={-1}
                data-state={isSelected ? 'selected' : undefined}
                onKeyDown={e => handleKeyDown(e, i, id)}
                className="group h-[58px] border-b border-white/10 bg-transparent transition-colors hover:bg-white/6 focus-visible:bg-white/8"
              >
                {isBulkMode && (
                  <TableCell className="w-8 px-3 py-3">
                    <Checkbox
                      aria-label={`Select ${p.name}`}
                      checked={isSelected}
                      onCheckedChange={() => onSelect(id)}
                    />
                  </TableCell>
                )}
                <TableCell className="w-10 px-3 py-3">
                  <ProductThumb
                    className="h-10 w-10"
                    src={resolveImage(
                      p.sample_image_url ?? p.image_main,
                      p.availability_status,
                    )}
                    name={p.name}
                    brand={p.brand}
                  />
                </TableCell>
                <TableCell className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <a
                        href={`#${p.catalog_id}`}
                        aria-label={`View details for ${p.name}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {p.name}
                      </a>
                      {(p.brand || p.canonical_pack) && (
                        <span className="truncate text-xs text-muted-foreground">
                          {p.brand}
                          {p.brand && p.canonical_pack && ' • '}
                          {p.canonical_pack}
                        </span>
                      )}
                    </div>
                    <AddToCartButton
                      product={p}
                      className="ml-auto"
                    />
                  </div>
                </TableCell>
                <TableCell className="w-[120px] px-3 py-3">
                  <div className="flex h-6 items-center justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AvailabilityBadge
                          tabIndex={-1}
                          status={p.availability_status}
                          updatedAt={p.availability_updated_at}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="space-y-1">
                        <div>{availabilityLabel}.</div>
                        <div className="text-xs text-muted-foreground">
                          Last checked {p.availability_updated_at ? timeAgo(p.availability_updated_at) : 'unknown'}. Source: {p.suppliers?.[0] || 'Unknown'}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="w-[136px] whitespace-nowrap px-3 py-3 text-right">
                  <PriceCell product={p} />
                </TableCell>
                <TableCell className="w-[220px] min-w-[180px] max-w-[220px] px-3 py-3">
                  {(() => {
                    // Map supplier IDs to SupplierChips format
                    const supplierIds = p.supplier_ids ?? []
                    if (supplierIds.length === 0) {
                      return (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex justify-center text-muted-foreground">—</div>
                          </TooltipTrigger>
                          <TooltipContent>No supplier data</TooltipContent>
                        </Tooltip>
                      )
                    }

                    // Create connected supplier ID set for is_connected lookup
                    const connectedSupplierIds = new Set(
                      connectedSuppliers?.map(cs => cs.supplier_id) ?? []
                    )

                    // Map to SupplierChips format
                    const suppliers = supplierIds.map((id: string, i: number) => {
                      // Try to get supplier name from multiple sources
                      let supplierName = p.supplier_names?.[i] || id
                      let supplierLogoUrl = p.supplier_logo_urls?.[i] || null

                      // Fallback to allSuppliers lookup if name is missing
                      if (!supplierName || supplierName === id) {
                        const supplierData = allSuppliers?.find(s => s.id === id)
                        if (supplierData) {
                          supplierName = supplierData.name
                          supplierLogoUrl = supplierData.logo_url || supplierLogoUrl
                        }
                      }

                      // Fallback to vendors lookup (localStorage-based)
                      if (!supplierLogoUrl) {
                        const vendor = vendors.find(v => v.name === supplierName || v.id === id)
                        supplierLogoUrl = vendor?.logo_url || vendor?.logoUrl || null
                      }

                      return {
                        supplier_id: id,
                        supplier_name: supplierName,
                        supplier_logo_url: supplierLogoUrl,
                        is_connected: connectedSupplierIds.has(id),
                        availability_state: p.availability_status as any,
                      }
                    })

                    return <SupplierChips suppliers={suppliers} />
                  })()}
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

  if (existingItem)
    return (
      <QuantityStepper
        className={className}
        quantity={existingItem.quantity}
        onChange={qty =>
          updateQuantity(existingItem.supplierItemId, qty)
        }
        onRemove={() => removeItem(existingItem.supplierItemId)}
        label={product.name}
        supplier={existingItem.supplierName}
      />
    )

  if (supplierEntries.length === 0) return null

  if (isUnavailable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(className, 'cursor-not-allowed')}>
            <Button
              size="sm"
              disabled
              aria-disabled="true"
              aria-label={`Add ${product.name} to cart`}
              className="pointer-events-none"
            >
              Add
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Out of stock</TooltipContent>
      </Tooltip>
    )
  }

  if (supplierEntries.length === 1) {
    const s = supplierEntries[0]
    return (
      <Button
        size="sm"
        className={className}
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
    )
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className={className} aria-label={`Add ${product.name} to cart`}>
          Add
        </Button>
      </PopoverTrigger>
    <PopoverContent className="w-64 p-2 space-y-1">
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

  let priceNode: React.ReactNode
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

  const priceContent = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{priceNode}</TooltipTrigger>
      <TooltipContent className="space-y-1">{tooltip}</TooltipContent>
    </Tooltip>
  ) : (
    priceNode
  )

  return (
    <div className="flex items-center justify-end gap-2">
      {priceContent}
    </div>
  )
}

