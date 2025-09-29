import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchCatalogFacets, FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from '@/state/catalogFiltersStore'
import { triStockToAvailability, type TriState } from '@/lib/catalogFilters'
import { useTranslation } from '@/lib/i18n'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
  focusedFacet?: keyof FacetFilters | null
  onClearFilters: () => void
}

export function CatalogFiltersPanel({ filters, onChange, focusedFacet, onClearFilters }: CatalogFiltersPanelProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'catalog.filters' })
  const triStock = useCatalogFilters(s => s.triStock)
  const setTriStock = useCatalogFilters(s => s.setTriStock)
  const triSuppliers = useCatalogFilters(s => s.triSuppliers)
  const setTriSuppliers = useCatalogFilters(s => s.setTriSuppliers)
  const triSpecial = useCatalogFilters(s => s.triSpecial)
  const setTriSpecial = useCatalogFilters(s => s.setTriSpecial)
  const availability = triStockToAvailability(triStock)

  const hasFacetFilters = React.useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return false
      if (value == null) return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some(
          v => v !== undefined && v !== null && v !== '',
        )
      }
      return Boolean(value)
    })
  }, [filters])

  const hasActiveFilters =
    hasFacetFilters ||
    triStock !== 'off' ||
    triSuppliers !== 'off' ||
    triSpecial !== 'off'

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
              <span>{item.name || t('facets.unknown')}</span>
            </div>
            <span className="text-muted-foreground">{item.count}</span>
          </label>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('title')}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
        >
          {t('actions.clear')}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="catalog-filter-stock" className="text-sm font-medium">
            {t('stock.label')}
          </Label>
          <Select
            value={triStock}
            onValueChange={value => setTriStock(value as TriState)}
          >
            <SelectTrigger id="catalog-filter-stock" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{t('stock.options.all')}</SelectItem>
              <SelectItem value="include">{t('stock.options.include')}</SelectItem>
              <SelectItem value="exclude">{t('stock.options.exclude')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="catalog-filter-suppliers" className="text-sm font-medium">
            {t('suppliers.label')}
          </Label>
          <Select
            value={triSuppliers}
            onValueChange={value => setTriSuppliers(value as TriState)}
          >
            <SelectTrigger id="catalog-filter-suppliers" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{t('suppliers.options.all')}</SelectItem>
              <SelectItem value="include">{t('suppliers.options.include')}</SelectItem>
              <SelectItem value="exclude">{t('suppliers.options.exclude')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="catalog-filter-specials" className="text-sm font-medium">
            {t('specials.label')}
          </Label>
          <Select
            value={triSpecial}
            onValueChange={value => setTriSpecial(value as TriState)}
          >
            <SelectTrigger id="catalog-filter-specials" className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{t('specials.options.all')}</SelectItem>
              <SelectItem value="include">{t('specials.options.include')}</SelectItem>
              <SelectItem value="exclude">{t('specials.options.exclude')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data && (
        <div className="space-y-4">
          {renderFacet(t('facets.categories'), data.categories, 'category')}
          {renderFacet(t('facets.suppliers'), data.suppliers, 'supplier')}
          {renderFacet(t('facets.brands'), data.brands, 'brand')}
          <div ref={facetRefs.packSizeRange} className="space-y-2">
            <div className="font-medium text-sm">{t('packSize.label')}</div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={t('packSize.placeholders.min')}
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
                placeholder={t('packSize.placeholders.max')}
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
