import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { TriStateFilterChip } from '@/components/ui/tri-state-chip'
import { useCatalogFilters, triStockToAvailability } from '@/state/catalogFilters'
import { Checkbox } from '@/components/ui/checkbox'

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
  focusedFacet?: keyof FacetFilters | null
}

export function CatalogFiltersPanel({ filters, onChange, focusedFacet }: CatalogFiltersPanelProps) {
  const triStock = useCatalogFilters(s => s.triStock)
  const setTriStock = useCatalogFilters(s => s.setTriStock)
  const availability = triStockToAvailability(triStock)

  const facetRefs: Record<keyof FacetFilters, React.RefObject<HTMLDivElement>> = {
    search: React.createRef(),
    brand: React.createRef(),
    category: React.createRef(),
    supplier: React.createRef(),
    availability: React.createRef(),
    packSizeRange: React.createRef(),
  }

  React.useEffect(() => {
    if (focusedFacet && facetRefs[focusedFacet]?.current) {
      facetRefs[focusedFacet]!.current!.scrollIntoView({
        block: 'start',
      })
    }
  }, [focusedFacet])

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
        const isSupplier = key === 'supplier'
        const selected = isSupplier
          ? (filters.supplier ?? []).includes(item.id)
          : (filters as any)[key] === item.id
        return (
          <label
            key={item.id}
            className={cn('flex items-center justify-between gap-2 text-sm')}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selected}
                onCheckedChange={checked => {
                  if (isSupplier) {
                    const cur = filters.supplier ?? []
                    const next = checked
                      ? [...cur, item.id]
                      : cur.filter(id => id !== item.id)
                    onChange({ supplier: next.length ? next : undefined })
                  } else {
                    onChange({ [key]: checked ? item.id : undefined })
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
      <TriStateFilterChip state={triStock} onStateChange={setTriStock} />
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

export default CatalogFiltersPanel
