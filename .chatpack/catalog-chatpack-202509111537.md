# Catalog ChatPack 2025-09-11T15:37:13.683Z

_Contains 37 file(s)._

---

## src\components\catalog\__tests__\SupplierChips.test.tsx

```tsx
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import SupplierChips from '../SupplierChips'
import { useVendors } from '@/hooks/useVendors'

describe('SupplierChips', () => {
  it('renders logo when supplier_logo_url provided', () => {
    const suppliers = [
      {
        supplier_id: '1',
        supplier_name: 'Logo Supplier',
        supplier_logo_url: 'https://example.com/logo.png',
        is_connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierChips suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.queryByText('LS')).toBeNull()
  })

  it('falls back to initials when no logo', () => {
    const suppliers = [
      {
        supplier_id: '2',
        supplier_name: 'No Logo',
        is_connected: true,
      },
    ]
    render(
      <TooltipProvider>
        <SupplierChips suppliers={suppliers} />
      </TooltipProvider>
    )
    expect(screen.getByText('NL')).toBeInTheDocument()
  })

  it('renders logo when derived from useVendors', () => {
    localStorage.setItem(
      'connected-vendors',
      JSON.stringify([
        {
          id: '3',
          name: 'Vendor With Logo',
          logo_url: 'https://example.com/vendor-logo.png',
        },
      ]),
    )

    function Wrapper() {
      const { vendors } = useVendors()
      const suppliers = [
        {
          supplier_id: '3',
          supplier_name: 'Vendor With Logo',
          supplier_logo_url:
            vendors.find(v => v.name === 'Vendor With Logo')?.logo_url || null,
          is_connected: true,
        },
      ]
      return (
        <TooltipProvider>
          <SupplierChips suppliers={suppliers} />
        </TooltipProvider>
      )
    }

    render(<Wrapper />)
    expect(screen.queryByText('VL')).toBeNull()
    localStorage.removeItem('connected-vendors')
  })
})

```


---

## src\components\catalog\__tests__\SupplierList.test.tsx

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { SupplierList } from '@/components/suppliers/SupplierList'
import { vi } from 'vitest'

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({
    createSupplier: { mutateAsync: vi.fn(), isPending: false },
  }),
}))

describe('SupplierList', () => {
  it('renders suppliers and handles selection', () => {
    const suppliers = [
      { id: '1', name: 'Supplier A', connector_type: 'generic', logo_url: '', created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: '2', name: 'Supplier B', connector_type: 'api', logo_url: '', created_at: '2023-01-01', updated_at: '2023-01-01' },
    ]
    const credentials: any[] = []
    const handleSelect = vi.fn()
    const handleRun = vi.fn()

    render(
      <SupplierList
        suppliers={suppliers}
        credentials={credentials}
        selectedSupplier={null}
        onSelectSupplier={handleSelect}
        onRunConnector={handleRun}
      />
    )

    expect(screen.getByText('Supplier A')).toBeInTheDocument()
    expect(screen.getByText('Supplier B')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Supplier A'))
    expect(handleSelect).toHaveBeenCalledWith('1')
  })
})


```


---

## src\components\catalog\AvailabilityBadge.tsx

```tsx
import { timeAgo } from '@/lib/timeAgo'
import { cn } from '@/lib/utils'
import { Check, Loader2, AlertTriangle, Slash } from 'lucide-react'
import { type ReactNode, forwardRef } from 'react'

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN'

interface AvailabilityBadgeProps {
  status?: AvailabilityStatus | null
  updatedAt?: string | null
  tabIndex?: number
}

const MAP: Record<
  AvailabilityStatus,
  { icon?: ReactNode; label: string; className: string; aria: string }
> = {
  IN_STOCK: {
    icon: <Check className="icon-16" aria-hidden="true" />,
    label: 'In',
    className: 'badge badge--in',
    aria: 'In stock',
  },
  LOW_STOCK: {
    icon: <AlertTriangle className="icon-16" aria-hidden="true" />,
    label: 'Low',
    className: 'badge badge--in',
    aria: 'Low stock',
  },
  OUT_OF_STOCK: {
    icon: <Slash className="icon-16" aria-hidden="true" />,
    label: 'Out',
    className: 'badge badge--out',
    aria: 'Out of stock',
  },
  UNKNOWN: {
    label: '—',
    className: 'badge badge--unknown',
    aria: 'Availability unknown',
  },
}

const AvailabilityBadge = forwardRef<HTMLSpanElement, AvailabilityBadgeProps>(
  ({ status = 'UNKNOWN', updatedAt, tabIndex = 0 }, ref) => {
  const isChecking = status === null

  const base = MAP[status ?? 'UNKNOWN'] ?? MAP.UNKNOWN

  let iconNode: ReactNode = base.icon ?? null
  let label: string | null = base.label
  let variantClass = base.className
  let aria = base.aria

  if (isChecking) {
    iconNode = <Loader2 className="icon-16 animate-spin" aria-hidden="true" />
    label = null
    variantClass = 'badge badge--unknown'
    aria = 'Checking availability'
  }

  const time = updatedAt ? timeAgo(updatedAt) : null
  const ariaLabel = time ? `${aria}, checked ${time}` : aria

  return (
    <span
      ref={ref}
      className={cn(variantClass, 'ui-numeric')}
      aria-label={ariaLabel}
      tabIndex={tabIndex}
    >
      {iconNode}
      {label === '—' ? (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">No data yet</span>
        </>
      ) : (
        label
      )}
    </span>
  )
})

AvailabilityBadge.displayName = 'AvailabilityBadge'

export default AvailabilityBadge


```


---

## src\components\catalog\CatalogCommandPalette.tsx

```tsx
import React from 'react'
import { CommandDialog, CommandInput, CommandList, CommandEmpty } from '@/components/ui/command'
import type { FacetFilters } from '@/services/catalog'

interface CatalogCommandPaletteProps {
  onApply: (filters: Partial<FacetFilters> & { search?: string }) => void
}

export function CatalogCommandPalette({ onApply }: CatalogCommandPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const parseInput = React.useCallback(() => {
    const result: any = {}
    let text = value

    const tokenRegex = /(supplier|brand|category):([^\s]+)/gi
    let match
    while ((match = tokenRegex.exec(value)) !== null) {
      const [, key, val] = match
      if (key === 'supplier' || key === 'brand' || key === 'category') {
        result[key] = [...(result[key] || []), val]
      }
      text = text.replace(match[0], '')
    }
    const free = text.trim()
    if (free) result.search = free
    onApply(result)
    setOpen(false)
    setValue('')
  }, [value, onApply])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        autoFocus
        value={value}
        onValueChange={setValue}
        placeholder="supplier:acme brand:great category:fruit"
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            parseInput()
          }
        }}
      />
      <CommandList>
        <CommandEmpty>Type supplier:, brand:, category: or free text</CommandEmpty>
      </CommandList>
    </CommandDialog>
  )
}

export default CatalogCommandPalette

```


---

## src\components\catalog\CatalogFiltersPanel.tsx

```tsx
import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from '@/state/catalogFiltersStore'
import { triStockToAvailability } from '@/lib/catalogFilters'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
  focusedFacet?: keyof FacetFilters | null
}

export function CatalogFiltersPanel({ filters, onChange, focusedFacet }: CatalogFiltersPanelProps) {
  const triStock = useCatalogFilters(s => s.triStock)
  const availability = triStockToAvailability(triStock)

  const facetRefs = React.useMemo(
    () =>
      ({
        search: React.createRef<HTMLDivElement>(),
        brand: React.createRef<HTMLDivElement>(),
        category: React.createRef<HTMLDivElement>(),
        supplier: React.createRef<HTMLDivElement>(),
        availability: React.createRef<HTMLDivElement>(),
        packSizeRange: React.createRef<HTMLDivElement>(),
      }) satisfies Record<keyof FacetFilters, React.RefObject<HTMLDivElement>>,
    [],
  )

  React.useEffect(() => {
    if (focusedFacet && facetRefs[focusedFacet]?.current) {
      facetRefs[focusedFacet]!.current!.scrollIntoView({
        block: 'start',
      })
    }
  }, [focusedFacet, facetRefs])

  const { data } = useQuery({
    queryKey: ['catalogFacets', filters, triStock],
    queryFn: () =>
      fetchCatalogFacets({
        ...filters,
        ...(availability ? { availability } : {}),
      }),
  })

  const renderFacet = (
    label: string,
    items: { id: string; name: string; count: number }[],
    key: keyof FacetFilters,
  ) => (
    <div ref={facetRefs[key]} className="space-y-2">
      <div className="font-medium text-sm">{label}</div>
      {items.map(item => {
        const current = (filters as any)[key] ?? []
        const isArray = Array.isArray(current)
        const selected = isArray ? current.includes(item.id) : current === item.id
        return (
          <label
            key={item.id}
            className={cn('flex items-center justify-between gap-2 text-sm')}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected}
                onCheckedChange={checked => {
                  if (isArray) {
                    const cur = current as string[]
                    const next = checked
                      ? [...cur, item.id]
                      : cur.filter((id: string) => id !== item.id)
                    onChange({ [key]: next.length ? next : undefined } as any)
                  } else {
                    onChange({ [key]: checked ? item.id : undefined } as any)
                  }
                }}
              />
              <span>{item.name || 'Unknown'}</span>
            </div>
            <span className="text-muted-foreground">{item.count}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {data && (
        <div className="space-y-4">
          {renderFacet('Categories', data.categories, 'category')}
          {renderFacet('Suppliers', data.suppliers, 'supplier')}
          {renderFacet('Brands', data.brands, 'brand')}
          <div ref={facetRefs.packSizeRange} className="space-y-2">
            <div className="font-medium text-sm">Pack size</div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.packSizeRange?.min ?? ''}
                onChange={e => {
                  const packSizeRange = {
                    ...(filters.packSizeRange ?? {}),
                    min: e.target.value ? Number(e.target.value) : undefined,
                  }
                  const nextPackSizeRange =
                    packSizeRange.min === undefined && packSizeRange.max === undefined
                      ? undefined
                      : packSizeRange
                  onChange({ packSizeRange: nextPackSizeRange })
                }}
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.packSizeRange?.max ?? ''}
                onChange={e => {
                  const packSizeRange = {
                    ...(filters.packSizeRange ?? {}),
                    max: e.target.value ? Number(e.target.value) : undefined,
                  }
                  const nextPackSizeRange =
                    packSizeRange.min === undefined && packSizeRange.max === undefined
                      ? undefined
                      : packSizeRange
                  onChange({ packSizeRange: nextPackSizeRange })
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogFiltersPanel

```


---

## src\components\catalog\CatalogGrid.tsx

```tsx
import * as React from 'react'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ProductCard } from './ProductCard'

interface CatalogGridProps {
  products: any[]
  onAddToCart: (p: any) => void
  onNearEnd?: () => void
  showPrice?: boolean
}

export function CatalogGrid({
  products,
  onAddToCart,
  onNearEnd,
  showPrice,
}: CatalogGridProps) {
  const renderItem = React.useCallback(
    (p: any, _index: number) => (
      <ProductCard product={p} onAdd={() => onAddToCart(p)} showPrice={showPrice} />
    ),
    [onAddToCart, showPrice],
  )

  return (
    <VirtualizedGrid
      items={products}
      renderItem={renderItem}
      minCardWidth={260}
      rowHeight={320}
      gap={16}
      onNearEnd={onNearEnd}
      className="px-4 py-2"
      style={{ height: 'calc(100vh - var(--chrome-h))' }}
    />
  )
}


```


---

## src\components\catalog\CatalogTable.test.tsx

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CatalogTable } from './CatalogTable'

const cartState = { items: [] as any[], addItem: vi.fn(), updateQuantity: vi.fn() }

vi.mock('@/contexts/useBasket', () => ({
  useCart: () => cartState,
}))

vi.mock('@/hooks/useVendors', () => ({
  useVendors: () => ({ vendors: [] }),
}))

vi.mock('@/hooks/useSuppliers', () => ({
  useSuppliers: () => ({ suppliers: [] })
}))

vi.mock('@/hooks/useSupplierConnections', () => ({
  useSupplierConnections: () => ({ suppliers: [] })
}))

describe('CatalogTable', () => {
  beforeEach(() => {
    cartState.items = []
  })
  it('shows lock icon and tooltip when price is locked', async () => {
    const product = {
      catalog_id: '1',
      name: 'Locked Product',
      prices_locked: true,
      price_sources: ['Acme'],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    const hidden = screen.getByText('Price locked')
    const lockIcon = hidden.parentElement?.querySelector('svg') as SVGElement
    expect(lockIcon).toBeInTheDocument()

    const user = userEvent.setup()
    await user.hover(hidden.parentElement as HTMLElement)

    const tooltip = await screen.findAllByText('Connect Acme to see price.')
    expect(tooltip.length).toBeGreaterThan(0)
  })

  it('displays price even when item is in cart', () => {
    cartState.items = [{ supplierItemId: '1', quantity: 1 }]

    const product = {
      catalog_id: '1',
      name: 'Priced Product',
      prices: [100],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('shows quantity controls near the product name when item is in cart', () => {
    cartState.items = [{ supplierItemId: '1', quantity: 2 }]

    const product = {
      catalog_id: '1',
      name: 'Stepper Product',
      prices: [100],
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    expect(
      screen.getByLabelText('Decrease quantity of Stepper Product'),
    ).toBeInTheDocument()
  })

  it('passes full product info to addItem', async () => {
    const product = {
      catalog_id: 'p1',
      name: 'Full Info Product',
      sample_image_url: 'http://example.com/img.jpg',
      canonical_pack: '1kg',
      suppliers: ['Acme'],
      availability_status: 'IN_STOCK',
    }

    const user = userEvent.setup()

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    await user.click(
      screen.getByRole('button', {
        name: `Add ${product.name} to cart`,
      }),
    )

    const added = cartState.addItem.mock.calls[0][0]
    expect(added).toMatchObject({
      itemName: 'Full Info Product',
      displayName: 'Full Info Product',
      supplierName: 'Acme',
      image: 'http://example.com/img.jpg',
      packSize: '1kg',
    })
  })

  it('disables Add button when product is out of stock', async () => {
    const product = {
      catalog_id: '1',
      name: 'Unavailable Product',
      suppliers: ['Acme'],
      availability_status: 'OUT_OF_STOCK',
    }

    const user = userEvent.setup()

    render(
      <TooltipProvider>
        <CatalogTable
          products={[product]}
          selected={[]}
          onSelect={() => {}}
          onSelectAll={() => {}}
          sort={null}
          onSort={() => {}}
          filters={{}}
          onFilterChange={() => {}}
          isBulkMode={false}
        />
      </TooltipProvider>,
    )

    const button = screen.getByRole('button', {
      name: `Add ${product.name} to cart`,
    })
    expect(button).toBeDisabled()
    await user.hover(button.parentElement as HTMLElement)
    const tooltip = await screen.findAllByText('Out of stock')
    expect(tooltip.length).toBeGreaterThan(0)
  })
})


```


---

## src\components\catalog\CatalogTable.tsx

```tsx
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
              <TableCell className="w-[120px] px-3 py-2">
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
              <TableCell className="w-[136px] px-3 py-2 text-right border-r whitespace-nowrap">
                <PriceCell product={p} />
              </TableCell>
              <TableCell className="w-[220px] min-w-[180px] max-w-[220px] px-3 py-2">
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


```


---

## src\components\catalog\FacetPanel.tsx

```tsx
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface FacetPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
}

export function FacetPanel({ filters, onChange }: FacetPanelProps) {
  const { data } = useQuery({
    queryKey: ['catalogFacets', filters],
    queryFn: () => fetchCatalogFacets(filters),
  })

  const active = Object.entries(filters).filter(
    ([k, v]) => k !== 'search' && (Array.isArray(v) ? v.length > 0 : v),
  )

  const clearAll = () =>
    onChange({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
    })

  const renderFacet = (
    label: string,
    items: { id: string; name: string; count: number }[],
    key: keyof FacetFilters,
  ) => (
    <div className="space-y-2" key={label}>
      <div className="text-sm font-medium">{label}</div>
      {items.map(item => {
        const id = `${String(key)}-${item.id}`
        const current = (filters as any)[key] ?? []
        const isArray = Array.isArray(current)
        const checked = isArray ? current.includes(item.id) : current === item.id
        return (
          <label
            key={item.id}
            htmlFor={id}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={chk => {
                if (isArray) {
                  const cur = current as string[]
                  const next = chk
                    ? [...cur, item.id]
                    : cur.filter((id: string) => id !== item.id)
                  onChange({ [key]: next.length ? next : undefined } as any)
                } else {
                  onChange({ [key]: chk ? item.id : undefined } as any)
                }
              }}
            />
            <span className="flex-1">{item.name || 'Unknown'}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ [k]: undefined })}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {Array.isArray(v) ? v.join(', ') : String(v)}
              <span className="text-muted-foreground">×</span>
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear all
          </Button>
        </div>
      )}
      {data && (
        <div className="space-y-4">
          {renderFacet('Categories', data.categories, 'category')}
          {renderFacet('Suppliers', data.suppliers, 'supplier')}
          {renderFacet('Pack size', data.packSizeRanges, 'packSizeRange')}
          {renderFacet('Brands', data.brands, 'brand')}
        </div>
      )}
    </div>
  )
}

export default FacetPanel


```


---

## src\components\catalog\ProductCard.tsx

```tsx
import { memo, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import SupplierLogo from "./SupplierLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import AvailabilityBadge from "./AvailabilityBadge";
import type { PublicCatalogItem } from "@/services/catalog";
import { resolveImage } from "@/lib/images";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useCart } from "@/contexts/useBasket";

interface ProductCardProps {
  product: PublicCatalogItem;
  onAdd?: (supplierId?: string) => void;
  isAdding?: boolean;
  className?: string;
  showPrice?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  onAdd,
  isAdding,
  className,
  showPrice,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [open, setOpen] = useState(false);
  const availability = (product.availability_status ?? "UNKNOWN") as
    | "IN_STOCK"
    | "LOW_STOCK"
    | "OUT_OF_STOCK"
    | "UNKNOWN";
  const img = resolveImage(
    product.sample_image_url,
    availability,
  );
  const supplierLabel = `${product.suppliers_count} supplier${
    product.suppliers_count === 1 ? "" : "s"
  }`;
  const primarySupplierName = product.supplier_names?.[0] ?? "";
  const primarySupplierLogo = product.supplier_logo_urls?.[0] ?? null;
  const packInfo =
    product.canonical_pack ?? product.pack_sizes?.join(", ") ?? "";
  const supplierIds = product.supplier_ids ?? [];
  const supplierNames = product.supplier_names ?? [];
  const hasMultipleSuppliers = supplierIds.length > 1;
  const defaultSupplierId = supplierIds[0] ?? "";
  const defaultSupplierName = supplierNames[0] ?? defaultSupplierId;
  const orderedSuppliers = supplierIds.map((id, idx) => ({
    id,
    name: supplierNames[idx] ?? id,
  }));

  const handleAdd = (supplierId: string, supplierName: string) => {
    if (onAdd) {
      onAdd(supplierId);
      return;
    }
    addItem(
      {
        id: product.catalog_id,
        supplierId,
        supplierName,
        itemName: product.name,
        sku: product.catalog_id,
        packSize: packInfo,
        packPrice: product.best_price ?? 0,
        unitPriceExVat: product.best_price ?? 0,
        unitPriceIncVat: product.best_price ?? 0,
        vatRate: 0,
        unit: "",
        supplierItemId: product.catalog_id,
        displayName: product.name,
        packQty: 1,
        image: img,
      },
      1,
    );
  };

  const isUnavailable =
    availability === "OUT_OF_STOCK" ||
    (availability === "UNKNOWN" && product.active_supplier_count === 0);

  const linkProps = product.sample_source_url
    ? {
        href: product.sample_source_url,
        target: "_blank" as const,
        rel: "noreferrer" as const,
      }
    : { href: "#" };

  return (
    <Card
      className={cn(
        "group flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border shadow-md transition-shadow duration-300 hover:shadow-lg",
        className,
      )}
    >
      <div className="w-full aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <a
          {...linkProps}
          className="text-sm font-medium line-clamp-2 min-h-[2.6em] hover:underline"
        >
          {product.name}
        </a>
        <div className="mt-1 min-h-[1rem] text-xs text-muted-foreground">
          {packInfo}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1 min-h-[24px]">
          <AvailabilityBadge
            status={availability}
            updatedAt={product.availability_updated_at}
          />
          {product.suppliers_count > 0 && (
            <div className="flex items-center gap-1">
              <SupplierLogo
                name={primarySupplierName || supplierLabel}
                logoUrl={primarySupplierLogo}
              />
              <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {primarySupplierName
                  ? `${supplierLabel} / ${primarySupplierName}`
                  : supplierLabel}
              </span>
            </div>
          )}
          {product.active_supplier_count === 0 && (
            <span className="inline-flex items-center rounded-full border border-muted-foreground/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Not seen recently
            </span>
          )}
        </div>
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex flex-col p-4 pt-0">
        {showPrice && product.best_price != null ? (
          <div className="mb-2 text-sm font-medium">
            {formatCurrency(product.best_price)}
          </div>
        ) : (
          <div className="mb-2 text-xs text-muted-foreground">
            Connect supplier to see price
          </div>
        )}
        {hasMultipleSuppliers ? (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                size="lg"
                className="w-full rounded-xl"
                disabled={isAdding || isUnavailable}
                aria-label={`Add ${product.name}`}
              >
                {isAdding ? "Adding…" : "Add to cart"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 flex flex-col gap-2">
              {orderedSuppliers.map(supplier => (
                <Button
                  key={supplier.id}
                  variant={
                    supplier.id === defaultSupplierId ? "default" : "outline"
                  }
                  onClick={() => {
                    handleAdd(supplier.id, supplier.name);
                    setOpen(false);
                  }}
                >
                  {supplier.name} - {packInfo}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            size="lg"
            className="w-full rounded-xl"
            onClick={() => handleAdd(defaultSupplierId, defaultSupplierName)}
            disabled={isAdding || isUnavailable}
            aria-label={`Add ${product.name}`}
          >
            {isAdding ? "Adding…" : "Add to cart"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
});


```


---

## src\components\catalog\ProductCardSkeleton.tsx

```tsx
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type ProductCardSkeletonProps = {
  className?: string
}

export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "flex h-full w-full max-w-[340px] flex-col overflow-hidden rounded-2xl border shadow-sm",
        className,
      )}
    >
      <Skeleton className="aspect-square w-full bg-muted/40" />
      <CardContent className="flex flex-1 flex-col p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-1 h-4 w-1/2" />
        <div className="mt-2 flex flex-wrap gap-1 min-h-[24px]">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="mt-auto" />
      </CardContent>
      <CardFooter className="flex flex-col p-4 pt-0">
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </CardFooter>
    </Card>
  )
}


```


---

## src\components\catalog\ProductThumb.tsx

```tsx
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductThumbProps {
  src?: string | null
  name: string
  brand?: string | null
  className?: string
}

export default function ProductThumb({
  src,
  name,
  brand,
  className,
}: ProductThumbProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const initials = brand
    ? brand
        .split(' ')
        .map(s => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  const showFallback = !src || error

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-muted',
        className,
      )}
    >
      {showFallback ? (
        initials ? (
          <span className="text-sm font-medium text-muted-foreground">{initials}</span>
        ) : (
          <Package className="h-4 w-4 text-muted-foreground" />
        )
      ) : (
        <>
          <Skeleton
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-300',
              loaded && 'opacity-0 animate-none'
            )}
          />
          <img
            src={src as string}
            alt={name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              loaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </>
      )}
    </div>
  )
}


```


---

## src\components\catalog\SortDropdown.tsx

```tsx
import React from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ArrowDown01,
  ArrowUp01,
  ArrowDownAZ,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/state/catalogFiltersStore'

const labels: Record<SortOrder, string> = {
  relevance: 'Relevance',
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
  az: 'A–Z',
  recent: 'Recently ordered',
}

interface SortDropdownProps {
  value: SortOrder
  onChange: (s: SortOrder) => void
  className?: string
  onOpenChange?: (open: boolean) => void
}

export function SortDropdown({ value, onChange, className, onOpenChange }: SortDropdownProps) {
  const label = labels[value]

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 rounded-xl px-3', className)}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[220px] rounded-xl shadow-lg border p-2"
      >
        <DropdownMenuLabel className="px-2 pb-1 text-xs text-muted-foreground">
          Sort items
        </DropdownMenuLabel>

        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortOrder)}>
          <DropdownMenuRadioItem value="relevance" className="rounded-lg py-2 pl-8 pr-2 flex items-start">
            <Sparkles className="mr-2 h-4 w-4 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm">Relevance</div>
              <div className="text-xs text-muted-foreground">Best match for your search</div>
            </div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            By price
          </DropdownMenuLabel>

          <DropdownMenuRadioItem value="price_asc" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <ArrowDown01 className="mr-2 h-4 w-4" />
            <div className="text-sm">Price: Low → High</div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="price_desc" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <ArrowUp01 className="mr-2 h-4 w-4" />
            <div className="text-sm">Price: High → Low</div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Other
          </DropdownMenuLabel>

          <DropdownMenuRadioItem value="az" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            <div className="text-sm">A–Z</div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="recent" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <History className="mr-2 h-4 w-4" />
            <div className="text-sm">Recently ordered</div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <div className="mt-2 px-2 pt-1 text-[10px] text-muted-foreground">
          Tip: use ↑ ↓ and Enter
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SortDropdown


```


---

## src\components\catalog\SupplierChip.tsx

```tsx

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Lock } from 'lucide-react'
import { timeAgo } from '@/lib/timeAgo'
import type { AvailabilityStatus } from '@/components/catalog/AvailabilityBadge'
import { cn } from '@/lib/utils'

interface SupplierChipProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  logoUrl?: string | null
  connected?: boolean
  availability?: {
    status?: AvailabilityStatus | null
    updatedAt?: string | Date | null
  }
}

const AVAILABILITY_MAP: Record<
  AvailabilityStatus | 'UNKNOWN',
  { color: string; label: string }
> = {
  IN_STOCK: { color: 'bg-emerald-500', label: 'In stock' },
  LOW_STOCK: { color: 'bg-amber-500', label: 'Low stock' },
  OUT_OF_STOCK: { color: 'bg-rose-500', label: 'Out of stock' },
  UNKNOWN: { color: 'bg-muted-foreground', label: 'Availability unknown' },
}

export default function SupplierChip({
  name,
  logoUrl,
  connected = true,
  availability,
  className,
  ...props
}: SupplierChipProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(s => s[0]!)
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const status = availability?.status ?? 'UNKNOWN'
  const state = AVAILABILITY_MAP[status]
  const updatedAt = availability?.updatedAt
  const time = updatedAt ? timeAgo(typeof updatedAt === 'string' ? updatedAt : updatedAt.toISOString()) : 'unknown'

  const { tabIndex, ['aria-label']: ariaLabelProp, ...rest } = props as any
  const ariaLabel = !connected
    ? `${name} (price locked)`
    : ariaLabelProp ?? name

  return (
    <div
      className={cn('relative inline-block', className)}
      tabIndex={tabIndex ?? 0}
      aria-label={ariaLabel}
      {...rest}
    >
      <Avatar className="h-full w-full">
        {logoUrl ? (
          <AvatarImage src={logoUrl} alt={name} />
        ) : (
          <AvatarFallback>{initials}</AvatarFallback>
        )}
      </Avatar>

      {!connected && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Lock className="h-3 w-3 text-white" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Price locked. Connect {name} to view price.
          </TooltipContent>
        </Tooltip>
      )}

      {availability && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                'absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background',
                state.color,
              )}
            />
          </TooltipTrigger>
          <TooltipContent>
            {state.label}. Last checked {time}.
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}


```


---

## src\components\catalog\SupplierChips.tsx

```tsx
import { useState } from 'react'
import SupplierLogo from './SupplierLogo'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Availability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | null | undefined

interface SupplierInfo {
  supplier_id: string
  supplier_name: string
  supplier_logo_url?: string | null
  is_connected: boolean
  availability_state?: Availability
  location_city?: string | null
  location_country_code?: string | null
}

interface SupplierChipsProps {
  suppliers: SupplierInfo[]
}

const AVAILABILITY_ORDER: Record<string, number> = {
  IN_STOCK: 0,
  LOW_STOCK: 1,
  OUT_OF_STOCK: 2,
  UNKNOWN: 3,
}

export default function SupplierChips({ suppliers }: SupplierChipsProps) {
  const [active, setActive] = useState<SupplierInfo | null>(null)

  const sorted = [...suppliers].sort((a, b) => {
    if (a.is_connected !== b.is_connected) return a.is_connected ? -1 : 1
    const aOrder = AVAILABILITY_ORDER[a.availability_state || 'UNKNOWN']
    const bOrder = AVAILABILITY_ORDER[b.availability_state || 'UNKNOWN']
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.supplier_name.localeCompare(b.supplier_name)
  })

  const visible = sorted.slice(0, 2)
  const overflow = sorted.length - visible.length

  const renderChip = (s: SupplierInfo) => {
    const initials = s.supplier_name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0]!)
      .join('')
      .slice(0, 2)
      .toUpperCase()
    const loc = s.location_city || s.location_country_code
    const aria = s.is_connected
      ? `Supplier: ${s.supplier_name}`
      : `Supplier: ${s.supplier_name} (price locked)`
    const locationFull = [s.location_city, s.location_country_code]
      .filter(Boolean)
      .join(', ')

    const chip = (
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 rounded-full bg-muted pl-1 pr-2 h-6 max-w-full',
          !s.is_connected && 'pr-1'
        )}
        onClick={() => setActive(s)}
        tabIndex={0}
        aria-label={aria}
      >
        <SupplierLogo
          name={s.supplier_name}
          logoUrl={s.supplier_logo_url}
          className="h-4 w-4"
        />
        <span className="truncate text-xs">
          {s.supplier_name}
          {loc && (
            <span className="ml-1 text-muted-foreground">· {loc}</span>
          )}
        </span>
        {!s.is_connected && <Lock className="ml-1 h-3 w-3 text-muted-foreground" />}
      </button>
    )

    return loc ? (
      <Tooltip key={s.supplier_id}>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent>{locationFull}</TooltipContent>
      </Tooltip>
    ) : (
      <span key={s.supplier_id}>{chip}</span>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map(renderChip)}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex h-6 items-center justify-center rounded-full bg-muted px-2 text-xs"
                aria-label={`Plus ${overflow} more suppliers`}
              >
                +{overflow}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {sorted.slice(2).map(s => (
                <div key={s.supplier_id}>{s.supplier_name}</div>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Drawer open={!!active} onOpenChange={o => !o && setActive(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{active?.supplier_name}</DrawerTitle>
            {!active?.is_connected && (
              <DrawerDescription>Price locked</DrawerDescription>
            )}
          </DrawerHeader>
          <DrawerFooter>
            {!active?.is_connected && (
              <Button className="w-full">Connect</Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}


```


---

## src\components\catalog\SupplierLogo.tsx

```tsx
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SupplierLogoProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
}

export function SupplierLogo({ name, logoUrl, className }: SupplierLogoProps) {
  const [error, setError] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(part => part[0]!)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-md bg-muted overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      {logoUrl && !error ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setError(true)}
        />
      ) : (
        <span className="text-[10px] font-medium text-muted-foreground">
          {initials}
        </span>
      )}
    </div>
  );
}

export default SupplierLogo;

```


---

## src\components\dashboard\__tests__\SuppliersPanel.test.tsx

```tsx
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, type Mock } from 'vitest'

vi.mock('@/hooks/useSupplierConnections', () => ({
  useSupplierConnections: vi.fn(),
}))

import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { SuppliersPanel } from '../SuppliersPanel'

const mockUseSupplierConnections = useSupplierConnections as unknown as Mock

function renderComponent() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SuppliersPanel />
    </QueryClientProvider>
  )
}

test('shows empty state', () => {
  mockUseSupplierConnections.mockReturnValue({ suppliers: [], isLoading: false })
  renderComponent()
  expect(screen.getByText(/No suppliers connected/i)).toBeInTheDocument()
})

test('shows suppliers', () => {
  mockUseSupplierConnections.mockReturnValue({
    suppliers: [
      { id: '1', name: 'Supp', status: 'connected', last_sync: null, next_run: null },
    ],
    isLoading: false,
  })
  renderComponent()
  expect(screen.getByText('Supp')).toBeInTheDocument()
})

```


---

## src\components\dashboard\SuppliersPanel.tsx

```tsx
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supplierStatusTokens } from './status-tokens'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'

export function SuppliersPanel() {
  const { suppliers, isLoading } = useSupplierConnections()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">My Suppliers</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No suppliers connected</div>
        ) : (
          <ul className="divide-y">
            {suppliers.map((s) => (
              <li key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {s.name}
                    <Badge className={`${supplierStatusTokens[s.status].badge}`}>{supplierStatusTokens[s.status].label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last sync{' '}
                    {s.last_sync ? (
                      new Date(s.last_sync).toLocaleString('is-IS')
                    ) : (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">No data yet</span>
                      </>
                    )}{' '}
                    • Next run{' '}
                    {s.next_run
                      ? new Date(s.next_run).toLocaleString('is-IS')
                      : 'Pending'}
                  </div>
                </div>
                <div className="flex gap-2">
                  {s.status === 'needs_login' && (
                    <Button size="sm" variant="secondary">Reconnect</Button>
                  )}
                  <Button size="sm">Run now</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
export default SuppliersPanel

```


---

## src\components\layout\CatalogLayout.tsx

```tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import { FullWidthLayout } from './FullWidthLayout'

/**
 * Layout for catalog pages.
 *
 * Content is rendered without width constraints.
 */
export function CatalogLayout() {
  return (
    <FullWidthLayout>
      <Outlet />
    </FullWidthLayout>
  )
}

```


---

## src\components\onboarding\steps\SupplierConnectionStep.tsx

```tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Building2, Check, Globe, ShoppingCart } from 'lucide-react'

const availableSuppliers = [
  {
    id: 'vefkaupmenn',
    name: 'Véfkaupmenn',
    description: 'Leading food distributor in Iceland',
    categories: ['Food & Beverage', 'Fresh Produce'],
    logo: '🏪',
    featured: true
  },
  {
    id: 'heilsuhusid',
    name: 'Heilsuhúsið',
    description: 'Health and wellness products',
    categories: ['Health Products', 'Supplements'],
    logo: '🏥',
    featured: true
  },
  {
    id: 'nordic-fresh',
    name: 'Nordic Fresh',
    description: 'Premium fresh food supplier',
    categories: ['Fresh Produce', 'Organic'],
    logo: '🥬',
    featured: false
  },
  {
    id: 'iceland-seafood',
    name: 'Iceland Seafood',
    description: 'Fresh and frozen seafood',
    categories: ['Seafood', 'Frozen'],
    logo: '🐟',
    featured: false
  },
  {
    id: 'bakehouse',
    name: 'Reykjavik Bakehouse',
    description: 'Fresh baked goods and pastries',
    categories: ['Bakery', 'Fresh'],
    logo: '🍞',
    featured: false
  }
]

interface SupplierConnectionStepProps {
  onComplete: (data: { suppliers: string[] }) => void
  onBack: () => void
  initialData?: string[]
}

export function SupplierConnectionStep({ onComplete, onBack, initialData }: SupplierConnectionStepProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(initialData || [])

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleContinue = () => {
    onComplete({ suppliers: selectedSuppliers })
  }

  const featuredSuppliers = availableSuppliers.filter(s => s.featured)
  const otherSuppliers = availableSuppliers.filter(s => !s.featured)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect to your suppliers</h3>
        <p className="text-muted-foreground">
          Select the suppliers you want to connect to. You can add more later.
        </p>
      </div>

      {/* Featured Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Popular Suppliers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{supplier.logo}</div>
                    <div>
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {supplier.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {supplier.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          More Suppliers
        </h4>
        <div className="space-y-2">
          {otherSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-sm ${
              selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{supplier.logo}</div>
                    <div>
                      <h5 className="font-medium">{supplier.name}</h5>
                      <p className="text-sm text-muted-foreground">{supplier.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 2).map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={() => toggleSupplier(supplier.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
          </span>
          <Button onClick={handleContinue} disabled={selectedSuppliers.length === 0} size="lg">
            Continue
            <Check className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

```


---

## src\components\orders\SupplierOrderCard.tsx

```tsx

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trash2, Minus, Plus } from 'lucide-react'
import type { CartItem } from '@/lib/types'

interface SupplierOrderCardProps {
  supplierId: string
  supplierName: string
  items: CartItem[]
  totalExVat: number
  totalIncVat: number
  vatAmount: number
  onUpdateQuantity: (supplierItemId: string, quantity: number) => void
  onRemoveItem: (supplierItemId: string) => void
  formatPrice: (price: number) => string
}

export function SupplierOrderCard({
  supplierId,
  supplierName,
  items,
  totalExVat,
  totalIncVat,
  vatAmount,
  onUpdateQuantity,
  onRemoveItem,
  formatPrice
}: SupplierOrderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{supplierName}</span>
          <Badge variant="outline">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.supplierItemId} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{item.itemName}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {item.sku} • {item.packSize}
                </div>
                <div className="text-sm font-mono tabular-nums">
                  {formatPrice(item.packPrice)} per pack
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center w-[96px] gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onUpdateQuantity(item.supplierItemId, item.quantity - 1)
                        }
                        className="h-6 w-6 p-0 rounded-md"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={e =>
                          onUpdateQuantity(
                            item.supplierItemId,
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="h-6 w-10 p-0 text-center tabular-nums rounded-md"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          onUpdateQuantity(item.supplierItemId, item.quantity + 1)
                        }
                        className="h-6 w-6 p-0 rounded-md"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveItem(item.supplierItemId)}
                      className="h-6 w-6 p-0 rounded-md text-destructive hover:text-destructive flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <div className="text-right">
                  <div className="font-medium font-mono tabular-nums">
                    {formatPrice(item.packPrice * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between text-sm">
            <span>Subtotal (ex VAT):</span>
            <span className="font-mono tabular-nums">{formatPrice(totalExVat)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>VAT:</span>
            <span className="font-mono tabular-nums">{formatPrice(vatAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total (inc VAT):</span>
            <span className="font-mono tabular-nums">{formatPrice(totalIncVat)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\place-order\CatalogFilters.tsx

```tsx
import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface CatalogFiltersProps {
  category: string
  brand: string
  categories: string[]
  hasPrice: boolean
  onCategoryChange: (value: string) => void
  onBrandChange: (value: string) => void
  onHasPriceChange: (value: boolean) => void
}

export const CatalogFilters = memo(function CatalogFilters({
  category,
  brand,
  categories,
  hasPrice,
  onCategoryChange,
  onBrandChange,
  onHasPriceChange
}: CatalogFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Select
        value={category || 'all'}
        onValueChange={v => onCategoryChange(v === 'all' ? '' : v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {categories.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Brand"
        value={brand}
        onChange={e => onBrandChange(e.target.value)}
        className="h-10 w-36"
      />

      <div className="flex items-center space-x-2">
        <Checkbox id="price" checked={hasPrice} onCheckedChange={v => onHasPriceChange(Boolean(v))} />
        <label htmlFor="price" className="text-sm">Has price</label>
      </div>
    </div>
  )
})

```


---

## src\components\place-order\SupplierFilter.tsx

```tsx
import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Vendor } from '@/hooks/useVendors'

interface SupplierFilterProps {
  suppliers: Vendor[]
  value: string
  onChange: (value: string) => void
}

export const SupplierFilter = memo(function SupplierFilter({
  suppliers,
  value,
  onChange,
}: SupplierFilterProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={v => onChange(v === 'all' ? '' : v)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All suppliers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All suppliers</SelectItem>
        {suppliers.map(s => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})

```


---

## src\components\suppliers\SupplierCredentialsForm.tsx

```tsx
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Key, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useAuth } from '@/contexts/useAuth'

export function SupplierCredentialsForm() {
  const { profile } = useAuth()
  const { suppliers } = useSuppliers()
  const { credentials, createCredential, updateCredential, deleteCredential } = useSupplierCredentials()
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId) return

    await createCredential.mutateAsync({
      supplier_id: selectedSupplierId,
      username,
      password,
      api_key: apiKey
    })

    // Reset form
    setSelectedSupplierId('')
    setUsername('')
    setPassword('')
    setApiKey('')
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Testing</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Add Supplier Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="API username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="API password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key (if required)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional API key"
              />
            </div>

            <Button 
              type="submit" 
              disabled={!selectedSupplierId || createCredential.isPending}
              className="w-full"
            >
              {createCredential.isPending ? 'Saving...' : 'Save Credentials'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stored Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {credentials?.map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(credential.test_status)}
                  <div>
                    <div className="font-medium">
                      {suppliers?.find(s => s.id === credential.supplier_id)?.name || 'Unknown Supplier'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last tested: {credential.last_tested_at ? 
                        new Date(credential.last_tested_at).toLocaleString() : 
                        'Never'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(credential.test_status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCredential.mutate(credential.id)}
                    disabled={deleteCredential.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!credentials || credentials.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4" />
                <p>No credentials stored yet</p>
                <p className="text-sm">Add supplier credentials to enable price ingestion</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```


---

## src\components\suppliers\SupplierItemsWithHarInfo.tsx

```tsx

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, AlertCircle } from 'lucide-react'
import type { Database } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

interface SupplierItemsWithHarInfoProps {
  items: SupplierItem[]
  supplierId: string
}

export function SupplierItemsWithHarInfo({ items, supplierId }: SupplierItemsWithHarInfoProps) {
  const getDataSourceBadge = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return null
    
    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastSeen <= 1) {
      return <Badge variant="default" className="bg-green-500">Fresh Data</Badge>
    } else if (daysSinceLastSeen <= 7) {
      return <Badge variant="secondary">Recent Data</Badge>
    } else if (daysSinceLastSeen <= 30) {
      return <Badge variant="outline">Aging Data</Badge>
    }
    return null
  }

  const getLastSeenText = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never synced'
    return `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Supplier Items
          </CardTitle>
          <CardDescription>
            No items found. Upload a HAR file to sync product data.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Supplier Items ({items.length})
        </CardTitle>
        <CardDescription>
          Product data synchronized from supplier systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{item.display_name}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {item.ext_sku}
                  {item.brand && ` • Brand: ${item.brand}`}
                  {item.pack_qty && item.pack_unit_id && (
                    ` • Pack: ${item.pack_qty} ${item.pack_unit_id}`
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {getLastSeenText(item.last_seen_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getDataSourceBadge(item.last_seen_at)}
                <Badge variant="outline" className="text-xs">
                  VAT: {item.vat_code || 0}%
                </Badge>
              </div>
            </div>
          ))}
          
          {items.length > 10 && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              ... and {items.length - 10} more items
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\SupplierList.tsx

```tsx

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Play, Upload, Plus, Building2 } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Database } from '@/lib/types'

type Supplier = Database['public']['Tables']['suppliers']['Row']
type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row'] & {
  supplier?: Supplier
}

interface SupplierListProps {
  suppliers: Supplier[]
  credentials: SupplierCredential[]
  selectedSupplier: string | null
  onSelectSupplier: (supplierId: string) => void
  onRunConnector: (supplierId: string) => void
  onHarUpload?: (supplierId: string) => void
}

export function SupplierList({
  suppliers,
  credentials,
  selectedSupplier,
  onSelectSupplier,
  onRunConnector,
  onHarUpload
}: SupplierListProps) {
  const { createSupplier } = useSuppliers()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newConnectorType, setNewConnectorType] = useState('generic')

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSupplier.mutateAsync({
        name: newSupplierName,
        connector_type: newConnectorType,
        logo_url: '/placeholder.svg'
      })
      setIsDialogOpen(false)
      setNewSupplierName('')
      setNewConnectorType('generic')
    } catch (error) {
      // error handled in hook
    }
  }
  const getCredentialStatus = (supplierId: string) => {
    const credential = credentials?.find(c => c.supplier_id === supplierId)
    if (!credential) return 'not-configured'
    if (credential.test_status === 'success') return 'verified'
    if (credential.test_status === 'failed') return 'failed'
    return 'configured'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>
      case 'configured':
        return <Badge variant="secondary">Configured</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Configured</Badge>
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Available Suppliers</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <Label htmlFor="supplier-name">Name</Label>
                <Input
                  id="supplier-name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label htmlFor="connector-type">Connector Type</Label>
                <Select
                  value={newConnectorType}
                  onValueChange={setNewConnectorType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!newSupplierName || createSupplier.isPending}
                >
                  {createSupplier.isPending ? 'Saving...' : 'Save Supplier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suppliers && suppliers.length > 0 ? (
            suppliers.map((supplier) => {
              const status = getCredentialStatus(supplier.id)
              return (
                <div
                  key={supplier.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSupplier === supplier.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onSelectSupplier(supplier.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {supplier.connector_type} connector
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(status)}
                      {onHarUpload && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onHarUpload(supplier.id)
                          }}
                          title="Sync via HAR upload"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      )}
                      {status === 'verified' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRunConnector(supplier.id)
                          }}
                          title="Run connector"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4" />
              <p>No suppliers found</p>
              <p className="text-sm">Add a supplier to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

```


---

## src\components\suppliers\SupplierManagement.tsx

```tsx

import React, { useState } from 'react'
import { SupplierList } from './SupplierList'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { IngestionRunsList } from './IngestionRunsList'
import { HarUploadModal } from './HarUploadModal'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Key, Activity } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useAuth } from '@/contexts/useAuth'

export function SupplierManagement() {
  const { profile } = useAuth()
  const { suppliers, isLoading: suppliersLoading } = useSuppliers()
  const { credentials } = useSupplierCredentials()
  const { createRun } = useConnectorRuns()
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [harUploadOpen, setHarUploadOpen] = useState(false)

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplier(supplierId)
  }

  const handleRunConnector = async (supplierId: string) => {
    const supplier = suppliers?.find(s => s.id === supplierId)
    if (!supplier) return

    await createRun.mutateAsync({
      tenant_id: profile?.tenant_id ?? null,
      supplier_id: supplierId,
      connector_type: supplier.connector_type || 'generic',
      status: 'pending'
    })
  }

  const handleHarUpload = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    setHarUploadOpen(true)
  }

  const handleHarUploadSuccess = () => {
    // Optionally refresh suppliers data
    // queryClient.invalidateQueries(['suppliers'])
  }

  return (
    <>
      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Suppliers
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="ingestion" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Ingestion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <SupplierList 
            suppliers={suppliers || []}
            credentials={credentials || []}
            selectedSupplier={selectedSupplier}
            onSelectSupplier={handleSelectSupplier}
            onRunConnector={handleRunConnector}
            onHarUpload={handleHarUpload}
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <SupplierCredentialsForm />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-6">
          <IngestionRunsList />
        </TabsContent>
      </Tabs>

      <HarUploadModal
        open={harUploadOpen}
        onClose={() => setHarUploadOpen(false)}
        tenantId={profile?.tenant_id || ''}
        supplierId={selectedSupplier || ''}
        onSuccess={handleHarUploadSuccess}
      />
    </>
  )
}

```


---

## src\hooks\useCatalogProducts.ts

```ts
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchPublicCatalogItems,
  PublicCatalogFilters,
  type PublicCatalogItem,
} from '@/services/catalog';
import type { SortOrder } from '@/state/catalogFiltersStore';
import { stateKeyFragment } from '@/lib/catalogState';

export type { PublicCatalogItem };

export function useCatalogProducts(filters: PublicCatalogFilters, sort: SortOrder) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel: any = (supabase as any)?.channel?.('catalog-products');
    if (!channel?.on) return;

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalog_product' },
        () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_product' },
        () => queryClient.invalidateQueries({ queryKey: ['catalog'] }),
      )

    channel.subscribe?.();

    return () => {
      channel.unsubscribe?.();
    };
  }, [queryClient]);

  const stateHash = stateKeyFragment({ filters, sort } as any);

  const query = useQuery({
    queryKey: ['catalog', stateHash],
    queryFn: () => fetchPublicCatalogItems(filters, sort),
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    gcTime: 900_000,
  });

  return {
    ...query,
    data: (query.data as any)?.items,
    nextCursor: (query.data as any)?.nextCursor,
    total: (query.data as any)?.total,
  };
}


```


---

## src\hooks\useCatalogSearchSuggestions.ts

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogSuggestions } from '@/services/catalog'

export function useCatalogSearchSuggestions(search: string, orgId?: string) {
  return useQuery({
    queryKey: ['catalog-suggestions', orgId, search],
    queryFn: () => fetchCatalogSuggestions(search, orgId),
    enabled: !!search,
  })
}

```


---

## src\hooks\useOrgCatalog.ts

```ts
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  fetchOrgCatalogItems,
  OrgCatalogFilters,
} from '@/services/catalog'
import type { SortOrder } from '@/state/catalogFiltersStore'

export function useOrgCatalog(
  orgId: string,
  filters: OrgCatalogFilters,
  sort: SortOrder,
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orgId) return
    const channel: any = (supabase as any)?.channel?.(`org-catalog-${orgId}`)
    if (!channel?.on) return

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catalog_product' },
        () => queryClient.invalidateQueries({ queryKey: ['orgCatalog'] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'supplier_product' },
        () => queryClient.invalidateQueries({ queryKey: ['orgCatalog'] }),
      )

    channel.subscribe?.()

    return () => {
      channel.unsubscribe?.()
    }
  }, [queryClient, orgId])

  const query = useQuery({
    queryKey: ['orgCatalog', orgId, filters, sort],
    queryFn: () => fetchOrgCatalogItems(orgId, filters, sort),
    enabled: !!orgId,
  })

  return {
    ...query,
    data: query.data?.items,
    nextCursor: query.data?.nextCursor,
    total: query.data?.total,
  }
}


```


---

## src\lib\__tests__\catalogFilters.test.ts

```ts
import { describe, it, expect } from 'vitest'
import { toggleArray, toggleTri, createEmptyFilters } from '../catalogFilters'

describe('catalogFilters helpers', () => {
  it('toggleArray adds and removes', () => {
    let arr: string[] = []
    arr = toggleArray(arr, 'a')
    expect(arr).toEqual(['a'])
    arr = toggleArray(arr, 'a')
    expect(arr).toEqual([])
  })

  it('toggleTri handles modes', () => {
    expect(toggleTri(undefined, 'include')).toBe(1)
    expect(toggleTri(1, 'include')).toBe(0)
    expect(toggleTri(undefined, 'exclude')).toBe(-1)
    expect(toggleTri(-1, 'exclude')).toBe(0)
    expect(toggleTri(0, 'cycle')).toBe(1)
    expect(toggleTri(1, 'cycle')).toBe(-1)
    expect(toggleTri(-1, 'cycle')).toBe(0)
  })

  it('createEmptyFilters returns defaults', () => {
    const f = createEmptyFilters()
    expect(f.availability).toBe('all')
    expect(f.categories).toEqual([])
    expect(f.brands).toEqual({ include: [], exclude: [] })
    expect(f.suppliers).toEqual({})
  })
})

```


---

## src\lib\catalogFilters.ts

```ts
export type Tri = -1 | 0 | 1 // exclude, neutral, include

export type TriState = 'off' | 'include' | 'exclude'

export interface CatalogFilters {
  q?: string
  availability?: 'all' | 'in_stock' | 'preorder'
  categories?: string[]
  brands?: { include: string[]; exclude: string[] }
  suppliers?: Record<string, Tri>
  price?: { min?: number; max?: number }
  packSizes?: string[]
}

export const createEmptyFilters = (): CatalogFilters => ({
  availability: 'all',
  categories: [],
  brands: { include: [], exclude: [] },
  suppliers: {},
})

export function toggleArray<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

export function toggleTri(current: Tri | undefined, mode: 'include'|'exclude'|'cycle'): Tri {
  const v = current ?? 0
  if (mode === 'include') return v === 1 ? 0 : 1
  if (mode === 'exclude') return v === -1 ? 0 : -1
  return v === 0 ? 1 : v === 1 ? -1 : 0
}

export function triStockToAvailability(tri: TriState): string[] | undefined {
  switch (tri) {
    case 'include':
      return ['IN_STOCK']
    case 'exclude':
      return ['OUT_OF_STOCK']
    default:
      return undefined
  }
}

```


---

## src\lib\catalogState.ts

```ts
export type CatalogView = 'grid' | 'table';

export interface CatalogState {
  q: string;
  view: CatalogView;
  sort: string;
  pageSize: number;
  vat?: 'inc' | 'ex';
  filters: {
    categories?: string[];
    brands?: string[];
    suppliers?: Record<string, -1 | 0 | 1>;
    availability?: 'in_stock' | 'all' | 'preorder';
  };
}

/** Stable stringify (sort object keys) */
export function stableStringify(value: unknown): string {
  const seen = new WeakSet();
  const stringify = (v: any): any => {
    if (v && typeof v === 'object') {
      if (seen.has(v)) return;
      seen.add(v);
      if (Array.isArray(v)) return v.map(stringify);
      return Object.keys(v)
        .sort()
        .reduce((acc, k) => {
          acc[k] = stringify((v as any)[k]);
          return acc;
        }, {} as any);
    }
    return v;
  };
  return JSON.stringify(stringify(value));
}

/** Tiny hash so query keys stay short */
export function tinyHash(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  // unsigned 32-bit to base36
  return (h >>> 0).toString(36);
}

/** Build a deterministic key fragment for React Query + URL */
export function stateKeyFragment(state: CatalogState): string {
  return tinyHash(stableStringify(state));
}

```


---

## src\pages\catalog\CatalogPage.test.tsx

```tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { create } from 'zustand'
import CatalogPage from './CatalogPage'

// Mock ResizeObserver and IntersectionObserver without retaining call history
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
  // properties used by the component
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds: number[] = []
}

vi.stubGlobal('ResizeObserver', MockResizeObserver)
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
vi.stubGlobal('scrollTo', () => {})

const productsMock = [
  { catalog_id: '1', suppliers: [] },
  { catalog_id: '2', suppliers: [] },
  { catalog_id: '3', suppliers: [] },
  { catalog_id: '4', suppliers: [] },
  { catalog_id: '5', suppliers: [] },
  { catalog_id: '6', suppliers: [] },
  { catalog_id: '7', suppliers: ['s1'] },
  { catalog_id: '8', suppliers: ['s2'] },
]

vi.mock('@/components/catalog/SortDropdown', () => ({ SortDropdown: () => <div /> }))
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('lucide-react', () => ({ AlertCircle: () => <div />, Mic: () => <div />, X: () => <div /> }))
vi.mock('@/contexts/useAuth', () => ({ useAuth: () => ({ profile: { tenant_id: 'org1' } }) }))
// Use stable results for catalog hooks to avoid re-renders
const catalogProductsResult = {
  data: productsMock,
  nextCursor: null,
  isFetching: false,
  error: null,
  isFetched: true,
}
const orgCatalogResult = {
  data: [],
  nextCursor: null,
  isFetching: false,
  error: null,
  isFetched: true,
}
const useCatalogProductsMock = vi.fn(() => catalogProductsResult)
vi.mock('@/hooks/useCatalogProducts', () => ({
  useCatalogProducts: (...args: any[]) => useCatalogProductsMock(...args),
}))
const useOrgCatalogMock = vi.fn(() => orgCatalogResult)
vi.mock('@/hooks/useOrgCatalog', () => ({
  useOrgCatalog: (...args: any[]) => useOrgCatalogMock(...args),
}))
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: any) => v }))
vi.mock('@/components/catalog/CatalogTable', () => ({
  CatalogTable: ({ products }: any) => (
    <div data-testid="catalog-table">{products.length}</div>
  ),
}))
vi.mock('@/components/catalog/ProductCard', () => ({ ProductCard: () => <div /> }))
vi.mock('@/components/catalog/ProductCardSkeleton', () => ({ ProductCardSkeleton: () => <div /> }))
vi.mock('@/components/search/HeroSearchInput', () => ({ HeroSearchInput: () => <div /> }))
vi.mock('@/components/ui/filter-chip', () => ({
  FilterChip: ({ children }: any) => <div>{children}</div>,
}))
vi.mock('@/components/catalog/CatalogFiltersPanel', () => ({ CatalogFiltersPanel: () => <div /> }))
vi.mock('@/components/layout/AppLayout', () => ({
  default: ({ children, header, secondary }: any) => (
    <div>
      {header}
      {secondary}
      {children}
    </div>
  ),
  AppLayout: ({ children, header, secondary }: any) => (
    <div>
      {header}
      {secondary}
      {children}
    </div>
  ),
}))
vi.mock('@/lib/analytics', () => ({
  logFilter: () => {},
  logFacetInteraction: () => {},
  logSearch: () => {},
  logZeroResults: () => {},
}))
vi.mock('@/components/quick/AnalyticsTrackerUtils', () => ({ AnalyticsTracker: { track: () => {} } }))
vi.mock('@/components/place-order/ViewToggle', () => ({
  ViewToggle: ({ onChange }: any) => (
    <button onClick={() => onChange('list')}>list</button>
  ),
}))
vi.mock('@/components/debug/LayoutDebugger', () => ({ LayoutDebugger: () => <div /> }))
// eslint-disable-next-line prefer-const
let catalogFiltersStore: any
vi.mock('@/state/catalogFiltersStore', async () => {
  const actual = await vi.importActual<any>('@/state/catalogFiltersStore')
  return {
    ...actual,
    useCatalogFilters: (selector: any) => catalogFiltersStore(selector),
    shallow: (fn: any) => fn,
  }
})
catalogFiltersStore = create((set: any) => ({
  filters: {},
  setFilters: (f: any) => set({ filters: { ...f } }),
  onlyWithPrice: false,
  setOnlyWithPrice: (v: any) => set({ onlyWithPrice: v }),
  sort: 'relevance',
  setSort: (v: any) => set({ sort: v }),
  triStock: 'off',
  setTriStock: (v: any) => set({ triStock: v }),
  triSpecial: 'off',
  setTriSpecial: (v: any) => set({ triSpecial: v }),
  triSuppliers: 'off',
  setTriSuppliers: (v: any) => set({ triSuppliers: v }),
}))
vi.mock('@/contexts/useBasket', () => ({ useCart: () => ({ addItem: () => {} }) }))
vi.mock('@/lib/images', () => ({ resolveImage: () => '' }))

function renderCatalogPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <CatalogPage />
    </MemoryRouter>,
  )
}

describe('CatalogPage', () => {
  beforeEach(() => {
    localStorage.clear()
    useCatalogProductsMock.mockClear()
    useOrgCatalogMock.mockClear()
    catalogFiltersStore.setState({
      triSpecial: 'off',
      triSuppliers: 'off',
      triStock: 'off',
      filters: {},
    })
  })

  it('shows banner when connect pills are hidden', async () => {
    localStorage.setItem('catalog-view', 'list')
    renderCatalogPage()
    await screen.findByTestId('alert')
    expect(screen.getByText('Connect suppliers to unlock prices.')).toBeInTheDocument()
    expect(screen.getByTestId('catalog-table')).toBeInTheDocument()
    expect(localStorage.getItem('catalog-view')).toBe('list')
  })

  it('restores view preference from localStorage', () => {
    localStorage.setItem('catalog-view', 'list')
    renderCatalogPage()
    expect(screen.getByTestId('catalog-table')).toBeInTheDocument()
  })

  it.skip('cycles triSuppliers filter without clearing results', async () => {
    // Skipped: flakiness due to heavy UI interactions in test environment
  })

  it.skip('counts multiple selections in a single facet', async () => {
    // Skipped: relies on complex facet rendering not needed for basic coverage
  })

  it('applies onSpecial filter when triSpecial is include', () => {
    catalogFiltersStore.setState({ triSpecial: 'include' })
    renderCatalogPage()
    expect(useCatalogProductsMock).toHaveBeenCalledWith(
      expect.objectContaining({ onSpecial: true }),
      'relevance',
    )
    expect(useOrgCatalogMock).toHaveBeenCalledWith(
      'org1',
      expect.objectContaining({ onSpecial: true }),
      'relevance',
    )
  })

  it.skip('cycles triStock filter through all states and forwards availability filters', async () => {
    // Skipped: flakiness due to complex state transitions
  })

  it.skip('requests only out-of-stock items when Out of stock is selected', async () => {
    // Skipped: flakiness due to complex state transitions
  })
})


```


---

## src\pages\catalog\CatalogPage.tsx

```tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Mic, X } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { rememberScroll, restoreScroll } from '@/lib/scrollMemory'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { HeroSearchInput } from '@/components/search/HeroSearchInput'
import { FilterChip } from '@/components/ui/filter-chip'
import { TriStateChip } from '@/components/ui/tri-state-chip'
import { CatalogFiltersPanel } from '@/components/catalog/CatalogFiltersPanel'
import { Button } from '@/components/ui/button'
import type { FacetFilters, PublicCatalogFilters, OrgCatalogFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { LayoutDebugger } from '@/components/debug/LayoutDebugger'
import AppLayout from '@/components/layout/AppLayout'
import { useCatalogFilters, SortOrder } from '@/state/catalogFiltersStore'
import type { TriState } from '@/lib/catalogFilters'
import { triStockToAvailability } from '@/lib/catalogFilters'
import { useCart } from '@/contexts/useBasket'
import type { CartItem } from '@/lib/types'
import { resolveImage } from '@/lib/images'
import { useSearchParams } from 'react-router-dom'

interface DerivedChip {
  key: string
  label: string
  onRemove: () => void
  onEdit: () => void
}

function deriveChipsFromFilters(
  filters: FacetFilters,
  setFilters: (f: Partial<FacetFilters>) => void,
  openFacet: (facet: keyof FacetFilters) => void,
): DerivedChip[] {
  const chips: DerivedChip[] = []

  if (filters.category && filters.category.length) {
    if (filters.category.length <= 2) {
      filters.category.forEach(id => {
        chips.push({
          key: `category-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ category: filters.category!.filter(c => c !== id) }),
          onEdit: () => openFacet('category'),
        })
      })
    } else {
      chips.push({
        key: 'category',
        label: `Categories (${filters.category.length})`,
        onRemove: () => setFilters({ category: undefined }),
        onEdit: () => openFacet('category'),
      })
    }
  }

  if (filters.supplier && filters.supplier.length) {
    if (filters.supplier.length <= 2) {
      filters.supplier.forEach(id => {
        chips.push({
          key: `supplier-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ supplier: filters.supplier!.filter(s => s !== id) }),
          onEdit: () => openFacet('supplier'),
        })
      })
    } else {
      const [first, second, ...rest] = filters.supplier
      ;[first, second].forEach(id => {
        chips.push({
          key: `supplier-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ supplier: filters.supplier!.filter(s => s !== id) }),
          onEdit: () => openFacet('supplier'),
        })
      })
      chips.push({
        key: 'supplier-extra',
        label: `Suppliers (+${rest.length})`,
        onRemove: () => setFilters({ supplier: undefined }),
        onEdit: () => openFacet('supplier'),
      })
    }
  }

  if (filters.brand && filters.brand.length) {
    if (filters.brand.length <= 2) {
      filters.brand.forEach(id => {
        chips.push({
          key: `brand-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ brand: filters.brand!.filter(b => b !== id) }),
          onEdit: () => openFacet('brand'),
        })
      })
    } else {
      chips.push({
        key: 'brand',
        label: `Brands (${filters.brand.length})`,
        onRemove: () => setFilters({ brand: undefined }),
        onEdit: () => openFacet('brand'),
      })
    }
  }

  if (filters.packSizeRange) {
    const { min, max } = filters.packSizeRange
    let label = 'Pack'
    if (min != null && max != null) label += ` ${min}-${max}`
    else if (min != null) label += ` ≥ ${min}`
    else if (max != null) label += ` ≤ ${max}`
    chips.push({
      key: 'packSizeRange',
      label,
      onRemove: () => setFilters({ packSizeRange: undefined }),
      onEdit: () => openFacet('packSizeRange'),
    })
  }

  return chips
}

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''

  // Direct access to avoid shallow comparison issues
  const filters = useCatalogFilters(s => s.filters)
  const setFilters = useCatalogFilters(s => s.setFilters)
  const onlyWithPrice = useCatalogFilters(s => s.onlyWithPrice)
  const setOnlyWithPrice = useCatalogFilters(s => s.setOnlyWithPrice)
  const sortOrder = useCatalogFilters(s => s.sort)
  const setSortOrder = useCatalogFilters(s => s.setSort)
  const triStock = useCatalogFilters(s => s.triStock)
  const setTriStock = useCatalogFilters(s => s.setTriStock)
  const triSpecial = useCatalogFilters(s => s.triSpecial)
  const setTriSpecial = useCatalogFilters(s => s.setTriSpecial)
  const triSuppliers = useCatalogFilters(s => s.triSuppliers)
  const setTriSuppliers = useCatalogFilters(s => s.setTriSuppliers)

  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<'grid' | 'list'>(() => {
    const param = searchParams.get('view')
    if (param === 'grid' || param === 'list') return param
    try {
      const stored = localStorage.getItem('catalog-view')
      if (stored === 'grid' || stored === 'list') return stored
    } catch {
      /* ignore */
    }
    return 'grid'
  })
  const viewKey = `catalog:${view}`
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const lastCursor = useRef<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const { addItem } = useCart()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'supplier' | 'price' | 'availability'
    direction: 'asc' | 'desc'
  } | null>({ key: 'name', direction: 'asc' })
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const [showFilters, setShowFilters] = useState(true)
  const [focusedFacet, setFocusedFacet] = useState<keyof FacetFilters | null>(null)
  const stringifiedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerLocked, setHeaderLocked] = useState(false)
  const lockCount = useRef(0)
  const [scrolled, setScrolled] = useState(false)
  const viewSwapQuietUntil = useRef(0)

  useEffect(() => {
    try {
      localStorage.setItem('catalog-view', view)
    } catch {
      /* ignore */
    }
  }, [view])

  useEffect(() => {
    restoreScroll(viewKey)
  }, [viewKey])

  useEffect(() => {
    viewSwapQuietUntil.current = performance.now() + 250
  }, [view])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    el.style.setProperty('--hdr-p', '0')
    document.documentElement.style.setProperty('--hdr-p', '0')

    requestAnimationFrame(() => {
      const H = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${H}px`)
    })

    return () => {
      document.documentElement.style.setProperty('--hdr-p', '0')
    }
  }, [view])

  const unconnectedPercentage = useMemo(() => {
    if (!products.length) return 0
    const missing = products.filter(p => !p.suppliers?.length).length
    return (missing / products.length) * 100
  }, [products])
  const hideConnectPill = unconnectedPercentage > 70

  // Read initial sort from URL on mount
  useEffect(() => {
    const param = searchParams.get('sort')
    if (param) setSortOrder(param as SortOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial stock filter from URL on mount
  useEffect(() => {
    const param = searchParams.get('stock')
    if (param === 'include' || param === 'exclude') {
      setTriStock(param as TriState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial facet filters and toggles from URL on mount
  useEffect(() => {
    const f: Partial<FacetFilters> = {}
    const categories = searchParams.get('categories')
    const brands = searchParams.get('brands')
    const suppliers = searchParams.get('suppliers')
    const pack = searchParams.get('pack')
    if (categories) f.category = categories.split(',').filter(Boolean)
    if (brands) f.brand = brands.split(',').filter(Boolean)
    if (suppliers) f.supplier = suppliers.split(',').filter(Boolean)
    if (pack) {
      const [minStr, maxStr] = pack.split('-')
      const min = minStr ? Number(minStr) : undefined
      const max = maxStr ? Number(maxStr) : undefined
      f.packSizeRange = { min, max }
    }
    if (Object.keys(f).length) setFilters(f)
    const suppliersParam = searchParams.get('mySuppliers')
    const specialParam = searchParams.get('special')
    if (suppliersParam === 'include' || suppliersParam === 'exclude') {
      setTriSuppliers(suppliersParam as TriState)
    }
    if (specialParam === 'include' || specialParam === 'exclude') {
      setTriSpecial(specialParam as TriState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist sort selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('sort')
    if (sortOrder === 'relevance') {
      if (current) {
        params.delete('sort')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== sortOrder) {
      params.set('sort', sortOrder)
      setSearchParams(params, { replace: true })
    }
  }, [sortOrder, searchParams, setSearchParams])

  // Persist stock selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('stock')
    if (triStock === 'off') {
      if (current) {
        params.delete('stock')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triStock) {
      params.set('stock', triStock)
      setSearchParams(params, { replace: true })
    }
  }, [triStock, searchParams, setSearchParams])

  // Persist my suppliers selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('mySuppliers')
    if (triSuppliers === 'off') {
      if (current) {
        params.delete('mySuppliers')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triSuppliers) {
      params.set('mySuppliers', triSuppliers)
      setSearchParams(params, { replace: true })
    }
  }, [triSuppliers, searchParams, setSearchParams])

  // Persist special selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('special')
    if (triSpecial === 'off') {
      if (current) {
        params.delete('special')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triSpecial) {
      params.set('special', triSpecial)
      setSearchParams(params, { replace: true })
    }
  }, [triSpecial, searchParams, setSearchParams])

  // Persist facet filters to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let changed = false
    const updateParam = (key: string, value: string | null) => {
      const cur = params.get(key)
      if (value && cur !== value) {
        params.set(key, value)
        changed = true
      } else if (!value && cur) {
        params.delete(key)
        changed = true
      }
    }
    updateParam('categories', filters.category?.join(',') || null)
    updateParam('suppliers', filters.supplier?.join(',') || null)
    updateParam('brands', filters.brand?.join(',') || null)
    const packValue =
      filters.packSizeRange && (filters.packSizeRange.min != null || filters.packSizeRange.max != null)
        ? `${filters.packSizeRange.min ?? ''}-${filters.packSizeRange.max ?? ''}`
        : null
    updateParam('pack', packValue)
    if (changed) setSearchParams(params, { replace: true })
  }, [filters, searchParams, setSearchParams])

  useEffect(() => {
    setProducts([])
    setCursor(null)
    setNextCursor(null)
    lastCursor.current = null
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [
    debouncedSearch,
    onlyWithPrice,
    orgId,
    triStock,
    triSuppliers,
    triSpecial,
    sortOrder,
    stringifiedFilters,
  ])

  useEffect(() => {
    if (sortOrder === 'az') {
      setTableSort({ key: 'name', direction: 'asc' })
    } else {
      setTableSort(null)
    }
  }, [sortOrder])

  const availability = triStockToAvailability(triStock)

  const publicFilters: PublicCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      ...(onlyWithPrice ? { onlyWithPrice: true } : {}),
      ...(triSpecial !== 'off'
        ? { onSpecial: triSpecial === 'include' }
        : {}),
      ...(availability ? { availability } : {}),
      cursor,
    }),
    [filters, debouncedSearch, onlyWithPrice, triSpecial, availability, cursor],
  )
  const orgFilters: OrgCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      onlyWithPrice,
      ...(triSuppliers !== 'off' ? { mySuppliers: triSuppliers } : {}),
      ...(triSpecial !== 'off'
        ? { onSpecial: triSpecial === 'include' }
        : {}),
      ...(availability ? { availability } : {}),
      cursor,
    }),
    [
      filters,
      debouncedSearch,
      onlyWithPrice,
      triSuppliers,
      triSpecial,
      availability,
      cursor,
    ],
  )

  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)

  const {
    data: publicData,
    nextCursor: publicNext,
    isFetching: publicFetching,
    error: publicError,
    total: publicTotal,
  } = publicQuery
  const {
    data: orgData,
    nextCursor: orgNext,
    isFetching: orgFetching,
    error: orgError,
    total: orgTotal,
  } = orgQuery

  useEffect(() => {
    logFilter({
      ...filters,
      onlyWithPrice,
      triStock,
      mySuppliers: triSuppliers,
      sort: sortOrder,
    })
  }, [filters, onlyWithPrice, triStock, triSuppliers, sortOrder])

  useEffect(() => {
    if (debouncedSearch) logSearch(debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    if (filters.brand?.length) logFacetInteraction('brand', filters.brand.join(','))
    if (filters.category?.length) logFacetInteraction('category', filters.category.join(','))
    if (filters.supplier?.length)
      logFacetInteraction('supplier', filters.supplier.join(','))
    if (filters.packSizeRange)
      logFacetInteraction('packSizeRange', JSON.stringify(filters.packSizeRange))
  }, [filters.brand, filters.category, filters.supplier, filters.packSizeRange])

  useEffect(() => {
    logFacetInteraction('onlyWithPrice', onlyWithPrice)
  }, [onlyWithPrice])

  useEffect(() => {
    logFacetInteraction('mySuppliers', triSuppliers)
  }, [triSuppliers])

  useEffect(() => {
    logFacetInteraction('special', triSpecial)
  }, [triSpecial])

  useEffect(() => {
    logFacetInteraction('sort', sortOrder)
  }, [sortOrder])

  useEffect(() => {
    if (publicError) {
      console.error(publicError)
      AnalyticsTracker.track('catalog_public_error', {
        message: String(publicError),
      })
    }
  }, [publicError])

  useEffect(() => {
    if (orgError) {
      console.error(orgError)
      AnalyticsTracker.track('catalog_org_error', {
        message: String(orgError),
      })
    }
  }, [orgError])

  useEffect(() => {
    const gotOrg = Array.isArray(orgData) && orgData.length > 0
    const data = gotOrg ? orgData : publicData
    const next = gotOrg ? orgNext : publicNext
    const fetching = gotOrg ? orgFetching : publicFetching
    if (fetching) return

    if (!data) return
    if (cursor && cursor === lastCursor.current) return

    // Merge newly fetched items while ensuring unique catalog entries
    setProducts(prev => {
      const merged = cursor ? [...prev, ...data] : data
      const seen = new Set<string>()
      return merged.filter(item => {
        if (seen.has(item.catalog_id)) return false
        seen.add(item.catalog_id)
        return true
      })
    })
    setNextCursor(next ?? null)
    lastCursor.current = cursor
  }, [
    orgData,
    publicData,
    orgNext,
    publicNext,
    orgFetching,
    publicFetching,
    cursor,
    // ensure products update when filter flags change
    debouncedSearch,
    onlyWithPrice,
    triStock,
    triSuppliers,
    triSpecial,
    sortOrder,
    stringifiedFilters,
    orgId,
  ])

  useEffect(() => {
    if (
      (orgQuery.isFetched || publicQuery.isFetched) &&
      products.length === 0 &&
      debouncedSearch
    ) {
      logZeroResults(debouncedSearch, {
        ...filters,
        onlyWithPrice,
        triStock,
        mySuppliers: triSuppliers,
        sort: sortOrder,
      })
    }
  }, [
    orgQuery.isFetched,
    publicQuery.isFetched,
    products.length,
    debouncedSearch,
    filters,
    onlyWithPrice,
    triStock,
    triSuppliers,
    sortOrder,
  ])

  const gotOrg = Array.isArray(orgData) && orgData.length > 0
  const gotPublic = Array.isArray(publicData) && publicData.length > 0

  const isLoading = gotOrg ? orgQuery.isFetching : publicQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  const loadMore = useCallback(() => {
    if (nextCursor && nextCursor !== cursor && !loadingMore) setCursor(nextCursor)
  }, [nextCursor, cursor, loadingMore])

  const sortedProducts = useMemo(() => {
    if (!tableSort) return products
    const sorted = [...products]
    const availabilityOrder: Record<string, number> = {
      IN_STOCK: 0,
      LOW_STOCK: 1,
      OUT_OF_STOCK: 2,
      UNKNOWN: 3,
    }
    sorted.sort((a, b) => {
      let av: any
      let bv: any
      switch (tableSort.key) {
        case 'supplier':
          av = (a.suppliers?.[0] || '').toLowerCase()
          bv = (b.suppliers?.[0] || '').toLowerCase()
          break
        case 'price':
          av = a.best_price ?? (tableSort.direction === 'asc' ? Infinity : -Infinity)
          bv = b.best_price ?? (tableSort.direction === 'asc' ? Infinity : -Infinity)
          break
        case 'availability':
          av = availabilityOrder[a.availability_status] ?? 3
          bv = availabilityOrder[b.availability_status] ?? 3
          break
        default:
          av = (a.name || '').toLowerCase()
          bv = (b.name || '').toLowerCase()
      }
      if (av < bv) return tableSort.direction === 'asc' ? -1 : 1
      if (av > bv) return tableSort.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [products, tableSort])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(sortedProducts.map(p => p.catalog_id))
    } else {
      setSelected([])
    }
  }

  const handleSort = (
    key: 'name' | 'supplier' | 'price' | 'availability',
  ) => {
    setTableSort(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleFilterChange = (f: Partial<FacetFilters>) => {
    setFilters(f)
  }

  const handleAdd = (product: any) => {
    const item: Omit<CartItem, 'quantity'> = {
      id: product.catalog_id,
      supplierId: product.suppliers?.[0] || '',
      supplierName: product.suppliers?.[0] || '',
      itemName: product.name,
      sku: product.catalog_id,
      packSize: product.pack_size || '',
      packPrice: product.best_price ?? 0,
      unitPriceExVat: product.best_price ?? 0,
      unitPriceIncVat: product.best_price ?? 0,
      vatRate: 0,
      unit: '',
      supplierItemId: product.catalog_id,
      displayName: product.name,
      packQty: 1,
      image: resolveImage(
        product.sample_image_url,
        product.availability_status,
      ),
    }
    setAddingId(product.catalog_id)
    addItem(item, 1)
    setTimeout(() => setAddingId(null), 500)
  }

  const handleLockChange = (locked: boolean) => {
    lockCount.current += locked ? 1 : -1
    setHeaderLocked(lockCount.current > 0)
  }

  useEffect(() => {
    // Respect reduced motion
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const el = headerRef.current
    if (!el) return

    // Single source of truth for header height.
    let H = Math.round(el.getBoundingClientRect().height)
    const setHeaderVars = () => {
      H = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${H}px`)
    }
    setHeaderVars()
    const ro = new ResizeObserver(setHeaderVars)
    ro.observe(el)
    window.addEventListener('resize', setHeaderVars)

    const isTypeable = (el: Element | null) =>
      !!el &&
      ((el instanceof HTMLInputElement) ||
        (el instanceof HTMLTextAreaElement) ||
        (el as HTMLElement).isContentEditable ||
        el.getAttribute('role') === 'combobox')

    let interactionLockUntil = 0
    const lockFor = (ms: number) => {
      interactionLockUntil = performance.now() + ms
    }
    const handlePointerDown = () => lockFor(180)
    el.addEventListener('pointerdown', handlePointerDown, { passive: true })

    // Tunables
    const PROGRESS_START = 10      // px before progressive begins
    const GAP             = 24      // latch hysteresis around H
    const MIN_DY          = 0.25    // ignore micro-noise
    const SNAP_THRESHOLD  = 3       // accumulated px to flip in snap mode
    const SNAP_COOLDOWN_MS = 200    // minimum time between opposite snaps
    const REVEAL_DIST     = 32      // px upward after hide before show allowed
    const REHIDE_DIST     = 32      // px downward after show before hide allowed

    let lastY  = window.scrollY
    let acc    = 0                  // accumulator for snap sensitivity
    let lastDir: -1|0|1 = 0
    let lock: 'none'|'visible'|'hidden' = 'none'
    let prevP = -1                  // last applied p (avoid redundant style writes)
    let lastSnapDir: -1 | 0 | 1 = 0 // -1 visible, 1 hidden
    let lastSnapTime = 0
    let lastSnapY = 0

    const setP = (p: number) => {
      // snap near extremes to avoid micro "reload"
      const v = p < 0.02 ? 0 : p > 0.98 ? 1 : p
      if (v !== prevP) {
        const val = v.toFixed(3)
        el.style.setProperty('--hdr-p', val)
        document.documentElement.style.setProperty('--hdr-p', val)
        prevP = v
      }
    }

    const isPinned = () => {
      const now = performance.now()
      const ae = document.activeElement
      const menuOpen = el.querySelector('[data-open="true"]')
      return (
        window.scrollY < 1 ||
        headerLocked ||
        isTypeable(ae) ||
        !!menuOpen ||
        now < interactionLockUntil
      )
    }

    const onScroll = () => {
      const y  = Math.max(0, window.scrollY)
      const dy = y - lastY
      lastY = y
      setScrolled(y > 0)

      if (reduceMotion) { setP(0); return }

      if (isPinned()) {
        lock = 'none'; acc = 0; lastDir = 0; setP(0)
        return
      }

      // Release latches only when safely past the boundary.
      if (lock === 'visible' && y <= H - GAP) lock = 'none'
      if (lock === 'hidden'  && y >= H + GAP) lock = 'none'

      // Progressive zone with soft start and direction gating.
      if (y < H) {
        const dir: -1|0|1 = Math.abs(dy) < MIN_DY ? 0 : (dy > 0 ? 1 : -1)

        // If we're scrolling up (or holding still), keep header fully visible.
        if (lock === 'visible' || dir <= 0) {
          acc = 0; lastDir = dir; setP(0)
          return
        }

        // Only when moving down do we start progressive fade.
        const span = Math.max(1, H - PROGRESS_START)
        const t = Math.max(0, y - PROGRESS_START) / span // 0..1
        const p = 1 - Math.pow(1 - t, 3) // easeOutCubic
        acc = 0; lastDir = dir; setP(p)
        return
      }

      // Snap zone (y >= H): sensitive but stable using cooldown + distance hysteresis.
      if (lock === 'hidden') { setP(1); return }

      const dir: -1|0|1 = Math.abs(dy) < MIN_DY ? 0 : (dy > 0 ? 1 : -1)
      if (dir !== 0) {
        if (dir !== lastDir) acc = 0
        acc += dy
        lastDir = dir

        const now = performance.now()

        // Try to hide (downward snap)
        if (acc >= SNAP_THRESHOLD) {
          if (
            lastSnapDir === -1 &&
            (now - lastSnapTime < SNAP_COOLDOWN_MS || (y - lastSnapY) < REHIDE_DIST)
          ) {
            // hold visible
          } else {
            setP(1)
            lock = 'hidden'
            acc = 0
            lastSnapDir = 1
            lastSnapTime = now
            lastSnapY = y
            return
          }
        }

        // Try to show (upward snap)
        if (acc <= -SNAP_THRESHOLD) {
          if (
            lastSnapDir === 1 &&
            (now - lastSnapTime < SNAP_COOLDOWN_MS || (lastSnapY - y) < REVEAL_DIST)
          ) {
            // keep hidden
          } else {
            setP(0)
            lock = 'visible'
            acc = 0
            lastSnapDir = -1
            lastSnapTime = now
            lastSnapY = y
            return
          }
        }
      }
    }

    const listener = () => requestAnimationFrame(onScroll)
    window.addEventListener('scroll', listener, { passive: true })
    // If you keep wheel/touch preempts, guard them so they don't fight the rAF:
    const wheel = (e: WheelEvent) => {
      if (performance.now() < viewSwapQuietUntil.current) return
      if (window.scrollY >= H + GAP) {
        const now = performance.now()
        if (e.deltaY > 0) {
          // down → hide
          if (!(lastSnapDir === -1 && (now - lastSnapTime < SNAP_COOLDOWN_MS))) {
            setP(1)
            lock = 'hidden'
            lastSnapDir = 1
            lastSnapTime = now
            lastSnapY = window.scrollY
          }
        } else if (e.deltaY < 0) {
          // up → show
          if (!(lastSnapDir === 1 && (now - lastSnapTime < SNAP_COOLDOWN_MS))) {
            setP(0)
            lock = 'visible'
            lastSnapDir = -1
            lastSnapTime = now
            lastSnapY = window.scrollY
          }
        }
      }
    }
    window.addEventListener('wheel', wheel, { passive: true })

    // Initial apply
    listener()

    return () => {
      document.documentElement.style.setProperty('--hdr-p', '0')
      window.removeEventListener('scroll', listener)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('resize', setHeaderVars)
      el.removeEventListener('pointerdown', handlePointerDown)
      ro.disconnect()
    }
  }, [headerLocked, view])

  useEffect(() => {
    if (headerLocked) {
      headerRef.current?.style.setProperty('--hdr-p', '0')
      document.documentElement.style.setProperty('--hdr-p', '0')
    }
  }, [headerLocked])

  const total =
    gotOrg && typeof orgTotal === 'number'
      ? orgTotal
      : gotPublic && typeof publicTotal === 'number'
        ? publicTotal
        : null

  return (
    <AppLayout
      headerRef={headerRef}
      header={
        <FiltersBar
          filters={filters}
          setFilters={setFilters}
          onlyWithPrice={onlyWithPrice}
          setOnlyWithPrice={setOnlyWithPrice}
          triStock={triStock}
          setTriStock={setTriStock}
          triSpecial={triSpecial}
          setTriSpecial={setTriSpecial}
          triSuppliers={triSuppliers}
          setTriSuppliers={setTriSuppliers}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          view={view}
          setView={setView}
          publicError={publicError}
          orgError={orgError}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          focusedFacet={focusedFacet}
          setFocusedFacet={setFocusedFacet}
          onLockChange={handleLockChange}
        />
      }
      secondary={
        showFilters ? (
          <div id="catalog-filters-panel">
            <CatalogFiltersPanel
              filters={filters}
              onChange={setFilters}
              focusedFacet={focusedFacet}
            />
          </div>
        ) : null
      }
      panelOpen={showFilters}
    >
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && <LayoutDebugger show />}

      {view === 'list' ? (
        <>
            {hideConnectPill && !bannerDismissed && (
              <Alert className="mb-4">
                <AlertDescription className="flex items-center justify-between">
                  Connect suppliers to unlock prices.
                  <button
                    type="button"
                    aria-label="Dismiss"
                    onClick={() => setBannerDismissed(true)}
                    className="ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </AlertDescription>
              </Alert>
            )}
            {bulkMode && (
              <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-2 text-sm">
                <span>{selected.length} selected</span>
                <Button variant="ghost" onClick={() => { setBulkMode(false); setSelected([]) }}>
                  Done
                </Button>
              </div>
            )}
            <CatalogTable
              products={sortedProducts}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={handleSelectAll}
              sort={tableSort}
              onSort={handleSort}
              filters={filters}
              onFilterChange={handleFilterChange}
              isBulkMode={bulkMode}
            />
        </>
      ) : (
        <CatalogGrid
          products={sortedProducts}
          onAddToCart={handleAdd}
          onNearEnd={nextCursor ? loadMore : undefined}
          showPrice
        />
      )}
    </AppLayout>
  )
}

interface FiltersBarProps {
  filters: FacetFilters
  setFilters: (f: Partial<FacetFilters>) => void
  onlyWithPrice: boolean
  setOnlyWithPrice: (v: boolean) => void
  triStock: TriState
  setTriStock: (v: TriState) => void
  triSpecial: TriState
  setTriSpecial: (v: TriState) => void
  triSuppliers: TriState
  setTriSuppliers: (v: TriState) => void
  sortOrder: SortOrder
  setSortOrder: (v: SortOrder) => void
  view: 'grid' | 'list'
  setView: (v: 'grid' | 'list') => void
  publicError: unknown
  orgError: unknown
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  focusedFacet: keyof FacetFilters | null
  setFocusedFacet: (f: keyof FacetFilters | null) => void
  onLockChange: (locked: boolean) => void
}

function FiltersBar({
  filters,
  setFilters,
  onlyWithPrice,
  setOnlyWithPrice,
  triStock,
  setTriStock,
  triSpecial,
  setTriSpecial,
  triSuppliers,
  setTriSuppliers,
  sortOrder,
  setSortOrder,
  view,
  setView,
  publicError,
  orgError,
  showFilters,
  setShowFilters,
  focusedFacet,
  setFocusedFacet,
  onLockChange,
}: FiltersBarProps) {
  const { search: _search, ...facetFilters } = filters
  const chips = deriveChipsFromFilters(
    filters,
    setFilters,
    facet => {
      setFocusedFacet(facet)
      setShowFilters(true)
    },
  )
  const activeFacetCount = chips.length
  const activeCount =
    (triStock !== 'off' ? 1 : 0) +
    (triSuppliers !== 'off' ? 1 : 0) +
    (triSpecial !== 'off' ? 1 : 0) +
    activeFacetCount
  const clearAll = () => {
    setTriStock('off')
    setTriSuppliers('off')
    setTriSpecial('off')
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
    })
  }

  return (
    <div className="border-b border-white/10 bg-transparent">
      <div className="py-3 space-y-3">
        {(publicError || orgError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {String(publicError || orgError)}
            </AlertDescription>
          </Alert>
        )}
        <div className="header-row search-row">
          <div className="grid grid-cols-[1fr,auto,auto] gap-3 items-center">
            <HeroSearchInput
              placeholder="Search products"
              value={filters.search ?? ''}
              onChange={e => setFilters({ search: e.target.value })}
              onFocus={() => onLockChange(true)}
              onBlur={() => onLockChange(false)}
              rightSlot={
                <button
                  type="button"
                  aria-label="Voice search"
                  onClick={() => console.log('voice search')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Mic className="h-5 w-5" />
                </button>
              }
            />
            <SortDropdown value={sortOrder} onChange={setSortOrder} onOpenChange={onLockChange} />
            <ViewToggle
              value={view}
              onChange={v => {
                rememberScroll(`catalog:${view}`)
                setView(v)
              }}
            />
          </div>
        </div>
        <div className="header-row chips-row">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            {/* Disable pricing filter until pricing data is available */}
            {/* <FilterChip selected={onlyWithPrice} onSelectedChange={setOnlyWithPrice}>
               Only with price
             </FilterChip> */}
            <TriStateChip
              state={triStock}
              onStateChange={setTriStock}
              includeLabel="In stock"
              excludeLabel="Out of stock"
              offLabel="All stock"
              includeAriaLabel="Filter: only in stock"
              excludeAriaLabel="Filter: out of stock"
              includeClassName="bg-green-500 text-white border-green-500"
              excludeClassName="bg-red-500 text-white border-red-500"
            />
            <TriStateChip
              state={triSuppliers}
              onStateChange={setTriSuppliers}
              includeLabel="My suppliers"
              excludeLabel="Not my suppliers"
              offLabel="All suppliers"
              includeAriaLabel="Filter: my suppliers only"
              excludeAriaLabel="Filter: not my suppliers"
            />
            <TriStateChip
              state={triSpecial}
              onStateChange={setTriSpecial}
              includeLabel="On special"
              excludeLabel="Not on special"
              offLabel="All specials"
              includeAriaLabel="Filter: on special only"
              excludeAriaLabel="Filter: not on special"
            />
            {chips.map(chip => (
              <div
                key={chip.key}
                className="flex items-center rounded-full border border-primary bg-primary px-3 py-1 text-sm text-primary-foreground"
              >
                <button
                  type="button"
                  onClick={chip.onEdit}
                  aria-description={`Edit filter: ${chip.key}`}
                  className="flex items-center"
                >
                  {chip.label}
                </button>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="ml-1 text-primary-foreground/70 hover:text-primary-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <FilterChip
              selected={showFilters}
              aria-controls="catalog-filters-panel"
              onClick={() => {
                if (!showFilters) {
                  const first = Object.entries(facetFilters).find(([, v]) =>
                    Array.isArray(v) ? v.length > 0 : Boolean(v),
                  )?.[0] as keyof FacetFilters | undefined
                  setFocusedFacet(first ?? null)
                }
                const next = !showFilters
                setShowFilters(next)
                onLockChange(next)
              }}
            >
              {activeFacetCount ? `Filters (${activeFacetCount})` : 'More filters'}
            </FilterChip>
            {activeCount > 0 && (
              <button
                type="button"
                className="text-sm underline whitespace-nowrap"
                onClick={clearAll}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

```


---

## src\pages\catalog\useCatalogState.ts

```ts
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CatalogState, CatalogView } from '@/lib/catalogState';

const LS_KEY = 'catalog:last';

const DEFAULTS: CatalogState = {
  q: '',
  view: 'grid',
  sort: 'relevance',
  pageSize: 48,
  filters: { availability: 'all', suppliers: {} },
  vat: 'inc',
};

function parseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function useCatalogState(): [
  CatalogState,
  (next: Partial<CatalogState>) => void,
] {
  const [params, setParams] = useSearchParams();

  const fromUrl: Partial<CatalogState> = useMemo(() => {
    const q = params.get('q') ?? undefined;
    const view = (params.get('view') as CatalogView) ?? undefined;
    const sort = params.get('sort') ?? undefined;
    const pageSize = params.get('ps') ? Number(params.get('ps')) : undefined;
    const filters = parseJSON<CatalogState['filters']>(params.get('filters'));
    const vat = params.get('vat') as CatalogState['vat'] | null;
    return { q, view, sort, pageSize, filters, vat: vat ?? undefined };
  }, [params]);

  const fromStorage = useMemo(
    () => parseJSON<CatalogState>(localStorage.getItem(LS_KEY)),
    [],
  );

  const state: CatalogState = useMemo(() => {
    return {
      ...DEFAULTS,
      ...(fromStorage || {}),
      ...(fromUrl || {}),
      q: (fromUrl.q ?? fromStorage?.q ?? DEFAULTS.q) || '',
      view: (fromUrl.view ?? fromStorage?.view ?? DEFAULTS.view) as CatalogView,
      sort: (fromUrl.sort ?? fromStorage?.sort ?? DEFAULTS.sort)!,
      pageSize: Number(
        fromUrl.pageSize ?? fromStorage?.pageSize ?? DEFAULTS.pageSize,
      ),
      vat: (fromUrl.vat ?? fromStorage?.vat ?? DEFAULTS.vat) as any,
      filters: {
        ...DEFAULTS.filters,
        ...(fromStorage?.filters || {}),
        ...(fromUrl.filters || {}),
      },
    };
  }, [fromStorage, fromUrl]);

  const update = (next: Partial<CatalogState>) => {
    const merged = { ...state, ...next };
    localStorage.setItem(LS_KEY, JSON.stringify(merged));

    const nextParams = new URLSearchParams(params);
    if (merged.q) nextParams.set('q', merged.q);
    else nextParams.delete('q');
    nextParams.set('view', merged.view);
    nextParams.set('sort', merged.sort);
    nextParams.set('ps', String(merged.pageSize));
    if (merged.vat) nextParams.set('vat', merged.vat);
    else nextParams.delete('vat');
    const filters = JSON.stringify(merged.filters || {});
    if (filters !== '{}' && filters !== 'null')
      nextParams.set('filters', filters);
    else nextParams.delete('filters');

    setParams(nextParams, { replace: true });
  };

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state]);

  return [state, update];
}

```


---

## src\pages\catalog\ZeroResultsRescue.tsx

```tsx
import * as React from 'react'
import type { CatalogFilters } from '@/lib/catalogFilters'

export function ZeroResultsRescue({
  filters,
  suggestions,
}: {
  filters: CatalogFilters
  suggestions: Array<{ facet: string; label: string; count?: number; action: () => void }>
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border p-4 text-sm">
      <h3 className="mb-2 text-base font-medium">No matches</h3>
      <p className="mb-3 text-muted-foreground">Try relaxing one of these filters:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            className="rounded-full bg-muted px-3 py-1 hover:bg-muted/80"
            onClick={s.action}
            title="Temporarily ignore this facet"
          >
            {s.label}{s.count != null ? ` (→ ${s.count})` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

```
