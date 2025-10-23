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
    <div className={cn('space-y-3', className)}>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--filters-text-muted)]">
        Quick Filters
      </span>
      <div className="flex flex-wrap gap-2.5">
        {(Object.keys(FILTER_PRESETS) as PresetKey[]).map(key => {
          const preset = FILTER_PRESETS[key]
          return (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className="group inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[color:var(--filters-chip-border)] bg-[color:var(--filters-chip-bg)] px-4 py-1.5 text-[13px] font-medium text-[color:var(--filters-text-secondary)] transition-colors duration-150 ease-out hover:border-[color:var(--filters-border-strong)] hover:bg-[color:var(--filters-chip-hover)] hover:text-[color:var(--filters-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--filters-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--filters-bg)] active:bg-[color:var(--filters-chip-hover)] motion-reduce:transition-none"
            >
              {preset.icon && (
                <span aria-hidden="true" className="text-[color:var(--filters-text-muted)] transition-colors group-hover:text-[color:var(--filters-text-primary)]">
                  {preset.icon}
                </span>
              )}
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
