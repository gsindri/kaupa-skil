import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters, triStockToAvailability } from '@/state/catalogFilters'
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
