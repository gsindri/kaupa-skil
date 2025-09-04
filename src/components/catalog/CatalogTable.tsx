import { useRef, useState, useEffect } from 'react'
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
import { Input } from '@/components/ui/input'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { timeAgo } from '@/lib/timeAgo'
import { formatCurrency } from '@/lib/format'
import type { FacetFilters } from '@/services/catalog'
import SupplierChip from '@/components/catalog/SupplierChip'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { Lock } from 'lucide-react'

interface CatalogTableProps {
  products: any[]
  selected: string[]
  onSelect: (id: string) => void
  onSelectAll: (checked: boolean) => void
  sort: { key: 'name' | 'supplier'; direction: 'asc' | 'desc' } | null
  onSort: (key: 'name' | 'supplier') => void
  filters: FacetFilters
  onFilterChange: (f: Partial<FacetFilters>) => void
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
}: CatalogTableProps) {
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([])

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
          <TableHead className="w-8">
            <Checkbox
              aria-label="Select all products"
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead className="w-16">Image</TableHead>
          <TableHead
            className="[width:minmax(0,1fr)] cursor-pointer select-none"
            onClick={() => onSort('name')}
          >
            Name {sort?.key === 'name' && (sort.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead className="w-28">Availability</TableHead>
          <TableHead
            className="min-w-[140px] max-w-[180px] w-40 cursor-pointer select-none"
            onClick={() => onSort('supplier')}
          >
            Suppliers {sort?.key === 'supplier' && (sort.direction === 'asc' ? '▲' : '▼')}
          </TableHead>
          <TableHead className="w-[112px] sm:w-[136px] text-right">Price</TableHead>
        </TableRow>
        <TableRow>
          <TableHead />
          <TableHead />
          <TableHead />
          <TableHead />
          <TableHead className="min-w-[140px] max-w-[180px] w-40">
            <Input
              value={filters.supplier ?? ''}
              onChange={e => onFilterChange({ supplier: e.target.value })}
              placeholder="Supplier"
              className="h-8"
            />
          </TableHead>
          <TableHead className="w-[112px] sm:w-[136px]" />
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
              className="h-12 focus-visible:bg-muted/50"
            >
              <TableCell className="w-8 p-2">
                <Checkbox
                  aria-label={`Select ${p.name}`}
                  checked={isSelected}
                  onCheckedChange={() => onSelect(id)}
                />
              </TableCell>
              <TableCell className="w-16 p-2">
                {p.image_main && (
                  <img
                    src={p.image_main}
                    alt={p.name}
                    className="h-12 w-12 rounded object-cover"
                  />
                )}
              </TableCell>
              <TableCell
                className="[width:minmax(0,1fr)] p-2"
                title={p.name}
              >
                <div className="truncate font-medium">{p.name}</div>
                {(p.brand || p.pack_size) && (
                  <div className="truncate text-xs text-muted-foreground">
                    {[p.brand, p.pack_size].filter(Boolean).join(' • ')}
                  </div>
                )}
              </TableCell>
              <TableCell className="w-28 p-2 whitespace-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AvailabilityBadge
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
              <TableCell className="min-w-[140px] max-w-[180px] w-40 p-2 whitespace-nowrap">
                {p.suppliers?.length ? (
                  <SupplierList suppliers={p.suppliers} />
                ) : (
                  <ConnectPill />
                )}
              </TableCell>
              <TableCell className="min-w-[112px] max-w-[136px] w-[112px] sm:w-[136px] p-2 text-right whitespace-nowrap">
                <PriceCell product={p} />
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
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

  let content: React.ReactNode

  if (isLocked) {
    content = (
      <div className="flex items-center justify-end gap-1 text-muted-foreground">
        <Lock className="h-4 w-4" />
        {sources.length ? <span>—</span> : <ConnectPill />}
      </div>
    )
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
    content = <span className="tabular-nums">{text}</span>
  } else {
    content = <ConnectPill />
  }

  if ((isLocked || priceValues.length) && sources.length) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{content}</div>
        </TooltipTrigger>
        <TooltipContent className="space-y-0.5">
          {sources.map((s: string) => (
            <div key={s}>{s}</div>
          ))}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

function SupplierList({ suppliers }: { suppliers: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(suppliers.length)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return

    const CHIP = 24
    const GAP = 6

    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width
      let count = Math.floor((width + GAP) / (CHIP + GAP))
      if (count < suppliers.length) {
        count = Math.max(0, count - 1)
      }
      setVisible(count)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [suppliers.length])

  const shown = suppliers.slice(0, visible)
  const remaining = suppliers.length - shown.length

  return (
    <div ref={ref} className="flex items-center gap-1.5 overflow-hidden">
      {shown.map(name => (
        <SupplierChip key={name} name={name} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground">+{remaining}</span>
      )}
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
        >
          Connect
        </Badge>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Connect a supplier</DrawerTitle>
          <DrawerDescription>
            Connect a supplier to view their prices and availability.
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  )
}

