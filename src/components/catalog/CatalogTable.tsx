import { useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useVendors } from '@/hooks/useVendors'
import AvailabilityBadge, { type AvailabilityStatus } from '@/components/catalog/AvailabilityBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { formatCurrency } from '@/lib/format'
import type { FacetFilters } from '@/services/catalog'
import ProductThumb from '@/components/catalog/ProductThumb'
import { resolveImage } from '@/lib/images'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
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
  showConnectPill?: boolean
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
  showConnectPill = true,
}: CatalogTableProps) {
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

  const { vendors } = useVendors()
  const supplierValues = filters.supplier ?? []
  const brandOptions = Array.from(
    new Set(products.map(p => p.brand).filter(Boolean) as string[]),
  ).sort()
  const showBrandFilter =
    products.length > 0 &&
    products.filter(p => p.brand).length / products.length > 0.3

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
          <TableHead className="w-8 px-2">
            <Checkbox
              aria-label="Select all products"
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead className="w-10 px-2">Image</TableHead>
          <TableHead
            className="[width:minmax(0,1fr)] cursor-pointer select-none px-2"
            onClick={() => onSort('name')}
          >
            Name {sort?.key === 'name' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-28 px-2 cursor-pointer select-none"
            onClick={() => onSort('availability')}
          >
            Availability {sort?.key === 'availability' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="w-[112px] sm:w-[136px] text-right px-2 cursor-pointer select-none"
            onClick={() => onSort('price')}
          >
            Price {sort?.key === 'price' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead
            className="min-w-[140px] max-w-[180px] w-40 cursor-pointer select-none px-2"
            onClick={() => onSort('supplier')}
          >
            Suppliers {sort?.key === 'supplier' && (sort?.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
        </TableRow>
        <TableRow>
          <TableHead className="px-2" />
          <TableHead className="px-2" />
          <TableHead className="px-2">
            {showBrandFilter && (
              <Select
                value={filters.brand ?? 'all'}
                onValueChange={v =>
                  onFilterChange({ brand: v === 'all' ? undefined : v })
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
          <TableHead className="px-2">
            <Select
              value={filters.availability ?? 'all'}
              onValueChange={v =>
                onFilterChange({
                  availability: v === 'all' ? undefined : v,
                })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Avail." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_STOCK">In</SelectItem>
                <SelectItem value="LOW_STOCK">Low</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out</SelectItem>
                <SelectItem value="UNKNOWN">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
          <TableHead className="w-[112px] sm:w-[136px] px-2" />
          <TableHead className="min-w-[140px] max-w-[180px] w-40 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-8 w-full justify-start">
                  {supplierValues.length ? `${supplierValues.length} selected` : 'Suppliers'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                {vendors.map(v => (
                  <DropdownMenuCheckboxItem
                    key={v.id}
                    checked={supplierValues.includes(v.id)}
                    onCheckedChange={chk => {
                      const next = chk
                        ? [...supplierValues, v.id]
                        : supplierValues.filter(id => id !== v.id)
                      onFilterChange({ supplier: next.length ? next : undefined })
                    }}
                  >
                    {v.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p, i) => {
          const id = p.catalog_id
          const isSelected = selected.includes(id)
          return (
            <TableRow
              key={id}
              ref={el => (rowRefs.current[i] = el)}
              tabIndex={0}
              data-state={isSelected ? 'selected' : undefined}
              onKeyDown={e => handleKeyDown(e, i, id)}
              className="group h-[52px] border-b hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              <TableCell className="w-8 p-2">
                <Checkbox
                  aria-label={`Select ${p.name}`}
                  checked={isSelected}
                  onCheckedChange={() => onSelect(id)}
                />
              </TableCell>
              <TableCell className="w-10 p-2">
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
              <TableCell
                className="[width:minmax(0,1fr)] p-2"
                title={p.name}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <a
                      href={`#${id}`}
                      aria-label={`View details for ${p.name}`}
                      className="block truncate font-medium hover:underline focus:underline"
                    >
                      {p.name}
                    </a>
                    {(p.brand || p.pack_size) && (
                      <div className="text-[13px] text-muted-foreground">
                        {[p.brand, p.pack_size].filter(Boolean).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-28 p-2 whitespace-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AvailabilityBadge
                      tabIndex={-1}
                      status={p.availability_status}
                      updatedAt={p.availability_updated_at}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="space-y-1">
                    {p.availability_text && <div>{p.availability_text}</div>}
                    <div className="text-xs text-muted-foreground">
                      Last checked {p.availability_updated_at ? timeAgo(p.availability_updated_at) : 'unknown'} • Source: {p.suppliers?.[0] || 'Unknown'}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="min-w-[112px] max-w-[136px] w-[112px] sm:w-[136px] p-2 text-right whitespace-nowrap">
                <PriceCell product={p} />
              </TableCell>
              <TableCell className="min-w-[140px] max-w-[180px] w-40 p-2 whitespace-nowrap">
                {p.suppliers?.length ? (
                  <SupplierList suppliers={p.suppliers} locked={p.prices_locked ?? p.price_locked} />
                ) : showConnectPill ? (
                  <ConnectPill />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
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
  vendors,
}: {
  product: any
  vendors: { id: string; name: string }[]
}) {
  const { items, addItem, updateQuantity } = useCart()
  const [open, setOpen] = useState(false)

  const existing = items.find(it => it.id === product.catalog_id)
  const quantity = existing?.quantity ?? 0

  const handleAdd = (supplier: string) => {
    const supplierItemId = `${product.catalog_id}:${supplier}`
    addItem(
      {
        id: product.catalog_id,
        supplierId: supplier,
        supplierName: supplier,
        itemName: product.name,
        sku: product.catalog_id,
        packSize: product.pack_size ?? '',
        packPrice: 0,
        unitPriceExVat: 0,
        unitPriceIncVat: 0,
        vatRate: 0,
        unit: '',
        supplierItemId,
        displayName: product.name,
        packQty: 1,
        image: product.sample_image_url ?? null,
      },
      1,
      { showToast: false },
    )
    setOpen(false)
  }

  const suppliers: string[] = product.suppliers || []

  return (
    <div className="ml-2 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
      {quantity > 0 && existing ? (
        <QuantityStepper
          quantity={quantity}
          onChange={q => updateQuantity(existing.supplierItemId, q)}
          label={product.name}
        />
      ) : suppliers.length > 1 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" className="h-7 px-2">
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 flex flex-col gap-1">
            {suppliers.map(s => {
              const connected = vendors.some(v => v.name === s)
              return (
                <Button
                  key={s}
                  variant="ghost"
                  className="justify-start gap-2 px-2 h-8"
                  onClick={() => handleAdd(s)}
                  disabled={!connected}
                >
                  <SupplierChip name={s} />
                  <span className="flex-1 text-left">{s}</span>
                  <AvailabilityBadge status={product.availability_status} />
                  {!connected && <Lock className="h-4 w-4" />}
                </Button>
              )
            })}
          </PopoverContent>
        </Popover>
      ) : (
        <Button
          size="sm"
          className="h-7 px-2"
          onClick={() => handleAdd(suppliers[0])}
          disabled={suppliers.length === 0}
        >
          Add
        </Button>
      )}
    </div>
  )
}

function PriceCell({ product }: { product: any }) {
  const sources: string[] = product.price_sources || product.suppliers || []
  const priceValues: number[] = Array.isArray(product.prices)
    ? product.prices
        .map((p: any) => (typeof p === 'number' ? p : p?.price))
        .filter((p: any) => typeof p === 'number')
    : []
  const isLocked = product.prices_locked ?? product.price_locked ?? false


  if (isLocked) {
    priceNode = (
      <div className="flex items-center justify-end gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span aria-hidden="true" className="tabular-nums">—</span>
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
  } else {
    priceNode = (
      <span className="tabular-nums">
        <span aria-hidden="true">—</span>
        <span className="sr-only">No data yet</span>
      </span>
    )
  }


  return (
    <div className="flex items-center justify-end gap-2">
      {priceContent}
      {qty > 0 ? (
        <QuantityStepper
          quantity={qty}
          onChange={setQty}
          label={label}
        />
      ) : (
        <Button
          size="sm"
          onClick={() => setQty(1)}
          aria-label={`Add ${product.name} to cart`}
        >
          Add
        </Button>
      )}
    </div>
  )
}


function SupplierList({ suppliers }: { suppliers: SupplierEntry[] }) {
  const items = suppliers.map(s =>
    typeof s === 'string'
      ? { name: s, availability_status: undefined }
      : {
          name: s.name,
          availability_status:
            s.availability_status ?? s.status ?? s.availability ?? undefined,
        },
  )

  const handleClick = (s: {
    name: string
    availability_status?: AvailabilityStatus | null
  }) => {
    if (s.availability_status === 'OUT_OF_STOCK') {
      toast({ description: 'Out of stock at selected supplier.' })
    }
  }

  return (
      ))}
    </div>
  )
}

function ConnectPill() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Badge
          variant="outline"
          className="cursor-pointer px-2 py-0.5 text-xs"
          aria-label="Connect suppliers"
          tabIndex={0}
        >
          Connect
        </Badge>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Connect suppliers</DrawerTitle>
          <DrawerDescription>
            Connect suppliers to view their prices and availability.
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  )
}

