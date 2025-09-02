import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
}

export function CatalogFiltersPanel({ filters, onChange }: CatalogFiltersPanelProps) {
  const { data } = useQuery({
    queryKey: ['catalogFacets', filters],
    queryFn: () => fetchCatalogFacets(filters),
  })

  const active = Object.entries(filters).filter(([, v]) => v)

  const renderFacet = (
    label: string,
    items: { id: string; name: string; count: number }[],
    key: keyof FacetFilters,
  ) => (
    <div className="space-y-1">
      <div className="font-medium text-sm">{label}</div>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() =>
            onChange({ [key]: filters[key] === item.id ? undefined : item.id })
          }
          className={cn(
            'flex w-full justify-between text-sm text-left',
            filters[key] === item.id ? 'underline font-semibold' : 'hover:underline',
          )}
        >
          <span>{item.name || 'Unknown'}</span>
          <span className="text-muted-foreground">{item.count}</span>
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {active.map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ [k]: undefined })}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              {String(v)}
              <span className="text-muted-foreground">×</span>
            </button>
          ))}
        </div>
      )}
      {data && (
        <div className="space-y-4">
          {renderFacet('Categories', data.categories, 'category')}
          {renderFacet('Suppliers', data.suppliers, 'supplier')}
          {renderFacet('Availability', data.availability, 'availability')}
          {renderFacet('Pack size', data.packSizeRanges, 'packSizeRange')}
          {renderFacet('Brands', data.brands, 'brand')}
        </div>
      )}
    </div>
  )
}

export default CatalogFiltersPanel
