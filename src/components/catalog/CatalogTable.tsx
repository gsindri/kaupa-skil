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
import SupplierChips from '@/components/catalog/SupplierChips'
import { resolveImage } from '@/lib/images'
import { Lock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-background">
        <TableRow>
          {isBulkMode && (
            <TableHead className="w-8 px-3">
              <Checkbox
                aria-label="Select all products"
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
          )}
          <TableHead className="w-10 px-3">Image</TableHead>
          <TableHead
            className="[width:minmax(0,1fr)] cursor-pointer select-none px-3"
            onClick={() => onSort('name')}
          >
            Name {sort?.key === 'name' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[120px] px-3 text-center cursor-pointer select-none"
            onClick={() => onSort('availability')}
          >
            Availability {sort?.key === 'availability' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[136px] text-right px-3 cursor-pointer select-none border-r"
            onClick={() => onSort('price')}
          >
            Price {sort?.key === 'price' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[220px] min-w-[180px] max-w-[220px] cursor-pointer select-none px-3"
            onClick={() => onSort('supplier')}
          >
            Suppliers {sort?.key === 'supplier' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
        </TableRow>
        {showFilterRow && (
          <TableRow>
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
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Brand" />
                  </SelectTrigger>
                  <SelectContent>
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
            <TableHead className="px-3">
              {/* Availability filter removed */}
            </TableHead>
            <TableHead className="w-[136px] px-3 pl-8 border-r" />
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
              className="group h-[52px] border-b hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              {isBulkMode && (
                <TableCell className="w-8 px-3 py-2">
                  <Checkbox
                    aria-label={`Select ${p.name}`}
                    checked={isSelected}
                    onCheckedChange={() => onSelect(id)}
                  />
                </TableCell>
              )}
              <TableCell className="w-10 px-3 py-2">
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
              <TableCell className="px-3 py-2">
                <div className="flex items-center gap-2">
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
              <TableCell className="w-[120px] px-3 py-2 text-center">
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
              </TableCell>
              <TableCell className="w-[136px] px-3 py-2 text-right border-r whitespace-nowrap">
                <PriceCell product={p} />
              </TableCell>
              <TableCell className="w-[220px] min-w-[180px] max-w-[220px] px-3 py-2">
                {(() => {
                  const suppliers = p.supplier_products?.length
                    ? p.supplier_products
                    : p.supplier_ids && p.supplier_names
                      ? p.supplier_ids.map((id: string, idx: number) => {
                          const name = p.supplier_names[idx] || id
                          return {
                            supplier_id: id,
                            supplier_name: name,
                            supplier_logo_url:
                              p.supplier_logo_urls?.[idx] ||
                              vendors.find(v => v.name === name)?.logo_url ||
                              null,
                            is_connected: true,
                          }
                        })
                      : Array.isArray(p.suppliers)
                        ? p.suppliers.map((s: any) => {
                            if (typeof s === 'string') {
                              return {
                                supplier_id: s,
                                supplier_name: s,
                                is_connected: true,
                                supplier_logo_url:
                                  vendors.find(v => v.name === s)?.logo_url ||
                                  null,
                              }
                            }
                            const name = s.supplier_name || s.name || ''
                            return {
                              supplier_id: s.supplier_id || s.id,
                              supplier_name: name,
                              is_connected: s.is_connected ?? true,
                              supplier_logo_url:
                                s.supplier_logo_url ||
                                s.logo_url ||
                                s.logoUrl ||
                                vendors.find(v => v.name === name)?.logo_url ||
                                null,
                              availability_state:
                                s.availability_state || s.availability_status,
                              location_city: s.location_city || null,
                              location_country_code:
                                s.location_country_code || null,
                            }
                          })
                        : []
                  return suppliers.length ? (
                    <SupplierChips suppliers={suppliers} />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex justify-center text-muted-foreground">—</div>
                      </TooltipTrigger>
                      <TooltipContent>No supplier data</TooltipContent>
                    </Tooltip>
                  )
                })()}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

  function AddToCartButton({
    product,
    className,
  }: {
    product: any
    className?: string
  }) {
    const { items, addItem, updateQuantity } = useCart()
    const existingItem = items.find(
      (i: any) => i.supplierItemId === product.catalog_id,
    )

    const [open, setOpen] = useState(false)

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

    if (existingItem)
      return (
        <QuantityStepper
          className={className}
          quantity={existingItem.quantity}
          onChange={qty =>
            updateQuantity(existingItem.supplierItemId, qty)
          }
          label={product.name}
          supplier={existingItem.supplierName}
        />
      )

  if (supplierEntries.length === 0) return null

  if (supplierEntries.length === 1) {
    const s = supplierEntries[0]
      return (
        <Button
          size="sm"
          className={className}
          onClick={() => {
            addItem({
              product_id: product.catalog_id,
              supplier_id: s.id,
              price: null,
              qty: 1,
            } as any)
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
        {supplierEntries.map(s => {
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
                addItem({
                  product_id: product.catalog_id,
                  supplier_id: s.id,
                  price: null,
                  qty: 1,
                } as any)
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

