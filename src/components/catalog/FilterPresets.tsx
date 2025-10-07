import { Button } from '@/components/ui/button'
import { FILTER_PRESETS, type PresetKey } from '@/lib/filterPresets'
import { useCatalogFilters, type SortOrder } from '@/state/catalogFiltersStore'
import { cn } from '@/lib/utils'

interface FilterPresetsProps {
  className?: string
}

export function FilterPresets({ className }: FilterPresetsProps) {
  const setInStock = useCatalogFilters(s => s.setInStock)
  const setMySuppliers = useCatalogFilters(s => s.setMySuppliers)
  const setOnSpecial = useCatalogFilters(s => s.setOnSpecial)
  const setSort = useCatalogFilters(s => s.setSort)

  const applyPreset = (key: PresetKey) => {
    const preset = FILTER_PRESETS[key]
    const params = preset.params
    
    // Apply boolean filters (use 'in' operator to check for property existence)
    if ('in_stock' in params && params.in_stock !== undefined) {
      setInStock(params.in_stock)
    }
    if ('my_suppliers' in params && params.my_suppliers !== undefined) {
      setMySuppliers(params.my_suppliers)
    }
    if ('special_only' in params && params.special_only !== undefined) {
      setOnSpecial(params.special_only)
    }
    
    // Apply sort
    if ('sort' in params && params.sort) {
      setSort(params.sort as SortOrder)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-dim)]/70">
        Quick Filters
      </span>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_PRESETS) as PresetKey[]).map(key => {
          const preset = FILTER_PRESETS[key]
          return (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(key)}
              className="h-8 gap-1.5 text-xs"
            >
              {preset.icon && <span aria-hidden="true">{preset.icon}</span>}
              {preset.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
