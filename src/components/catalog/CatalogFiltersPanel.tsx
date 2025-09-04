import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { TriStateFilterChip } from '@/components/ui/tri-state-chip'
import { useCatalogFilters, triStockToAvailability } from '@/state/catalogFilters'

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
}

export function CatalogFiltersPanel({ filters, onChange }: CatalogFiltersPanelProps) {
  const triStock = useCatalogFilters(s => s.triStock)
  const setTriStock = useCatalogFilters(s => s.setTriStock)
  const availability = triStockToAvailability(triStock)

  const { data } = useQuery({
    queryKey: ['catalogFacets', filters, triStock],
    queryFn: () =>
      fetchCatalogFacets({
        ...filters,
        ...(availability ? { availability } : {}),
      }),
  })

  const active = Object.entries(filters).filter(([, v]) =>
    Array.isArray(v) ? v.length > 0 : Boolean(v),
  )

  const renderFacet = (
    label: string,
    items: { id: string; name: string; count: number }[],
    key: keyof FacetFilters,
  ) => (
    <div className="space-y-1">
      <div className="font-medium text-sm">{label}</div>
      {items.map(item => {
        const isSupplier = key === 'supplier'
        const selected = isSupplier
          ? (filters.supplier ?? []).includes(item.id)
          : (filters as any)[key] === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (isSupplier) {
                const cur = filters.supplier ?? []
                const next = selected
                  ? cur.filter(id => id !== item.id)
                  : [...cur, item.id]
                onChange({ supplier: next.length ? next : undefined })
              } else {
                onChange({ [key]: selected ? undefined : item.id })
              }
            }}
            className={cn(
              'flex w-full justify-between text-sm text-left',
              selected ? 'underline font-semibold' : 'hover:underline',
            )}
          >
            <span>{item.name || 'Unknown'}</span>
            <span className="text-muted-foreground">{item.count}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-4">
      <TriStateFilterChip state={triStock} onStateChange={setTriStock} />
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
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

export default CatalogFiltersPanel
