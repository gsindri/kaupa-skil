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

  const active = Object.entries(filters).filter(([k, v]) => k !== 'search' && v)

  const clearAll = () =>
    onChange({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      availability: undefined,
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
        return (
          <label
            key={item.id}
            htmlFor={id}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <Checkbox
              id={id}
              checked={filters[key] === item.id}
              onCheckedChange={checked =>
                onChange({ [key]: checked ? item.id : undefined })
              }
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
              {String(v)}
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
          {renderFacet('Availability', data.availability, 'availability')}
          {renderFacet('Pack size', data.packSizeRanges, 'packSizeRange')}
          {renderFacet('Brands', data.brands, 'brand')}
        </div>
      )}
    </div>
  )
}

export default FacetPanel

