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

