import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'

import { fetchCatalogFacets, type FacetFilters } from '@/services/catalog'
import { cn } from '@/lib/utils'
import { useCatalogFilters } from '@/state/catalogFiltersStore'
import {
  triStockToAvailability,
  type TriState,
} from '@/lib/catalogFilters'
import { useTranslation } from '@/lib/i18n'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { FilterChip } from '@/components/ui/filter-chip'
import { useDebounce } from '@/hooks/useDebounce'
import { FilterPresets } from './FilterPresets'
import { AdvancedFilters } from './AdvancedFilters'
import { CaretDown } from '@phosphor-icons/react'

const FACET_STATE_KEY = 'catalog-facet-open-state'
const VIRTUALIZE_THRESHOLD = 50

export interface ActiveFilterChip {
  key: string
  label: string
  onRemove: () => void
  onEdit: () => void
}

interface CatalogFiltersPanelProps {
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
  focusedFacet?: keyof FacetFilters | null
  onClearFilters: () => void
  chips: ActiveFilterChip[]
  variant?: 'desktop' | 'drawer'
}

type FacetKey = Extract<keyof FacetFilters, 'brand' | 'category' | 'supplier'>

type FacetOpenState = Record<FacetKey | 'packSizeRange', boolean>

type FacetSearchState = Record<Extract<FacetKey, 'brand' | 'supplier'>, string>

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const segmentedBaseClass =
  'flex-1 rounded-[var(--ctrl-r,12px)] px-3 py-2 text-sm font-semibold transition duration-150 ease-out data-[state=on]:bg-[color:var(--seg-active-bg)] data-[state=on]:text-[color:var(--ink-hi)] data-[state=on]:shadow-[0_8px_22px_rgba(9,17,33,0.22)] hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] motion-reduce:transition-none'

type HeaderVars = CSSProperties & { '--ctrl-h'?: string; '--ctrl-r'?: string }

function useBatchedChange(onChange: (f: Partial<FacetFilters>) => void) {
  const queued = useRef<Partial<FacetFilters> | null>(null)
  const frame = useRef<number | null>(null)

  const flush = useCallback(() => {
    if (queued.current) {
      onChange(queued.current)
      queued.current = null
    }
    if (frame.current != null) {
      cancelAnimationFrame(frame.current)
      frame.current = null
    }
  }, [onChange])

  useEffect(() => flush, [flush])

  return useCallback(
    (value: Partial<FacetFilters>) => {
      queued.current = { ...queued.current, ...value }
      if (frame.current == null) {
        frame.current = requestAnimationFrame(() => {
          const payload = queued.current
          queued.current = null
          frame.current = null
          if (payload) onChange(payload)
        })
      }
    },
    [onChange],
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return false
    return window.matchMedia(REDUCED_MOTION_QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return () => {}
    const media = window.matchMedia(REDUCED_MOTION_QUERY)
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches)

    if ('addEventListener' in media) media.addEventListener('change', handler)
    // @ts-expect-error - addListener is deprecated but needed for older browsers
    else media.addListener(handler)

    setReduced(media.matches)

    return () => {
      if ('removeEventListener' in media) media.removeEventListener('change', handler)
      // @ts-expect-error - removeListener is deprecated but needed for older browsers
      else media.removeListener(handler)
    }
  }, [])

  return reduced
}

export function CatalogFiltersPanel({
  filters,
  onChange,
  focusedFacet,
  onClearFilters,
  chips,
  variant = 'desktop',
}: CatalogFiltersPanelProps) {
  const { t } = useTranslation(undefined, { keyPrefix: 'catalog.filters' })
  const inStock = useCatalogFilters(s => s.inStock)
  const setInStock = useCatalogFilters(s => s.setInStock)
  const mySuppliers = useCatalogFilters(s => s.mySuppliers)
  const setMySuppliers = useCatalogFilters(s => s.setMySuppliers)
  const onSpecial = useCatalogFilters(s => s.onSpecial)
  const setOnSpecial = useCatalogFilters(s => s.setOnSpecial)
  const availability = inStock ? ['IN_STOCK'] : undefined

  const batchedChange = useBatchedChange(onChange)

  const hasFacetFilters = useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return false
      if (value == null) return false
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>).some(v => v !== undefined && v !== null && v !== '')
      }
      return Boolean(value)
    })
  }, [filters])

  const hasActiveFilters =
    hasFacetFilters || inStock || mySuppliers || onSpecial

  const defaultOpenState: FacetOpenState = useMemo(
    () => ({ category: true, supplier: true, brand: true, packSizeRange: true }),
    [],
  )

  const [openFacets, setOpenFacets] = useState<FacetOpenState>(() => {
    if (typeof window === 'undefined') return defaultOpenState
    try {
      const raw = localStorage.getItem(FACET_STATE_KEY)
      if (!raw) return defaultOpenState
      const parsed = JSON.parse(raw) as Partial<FacetOpenState>
      return { ...defaultOpenState, ...parsed }
    } catch {
      return defaultOpenState
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(FACET_STATE_KEY, JSON.stringify(openFacets))
    } catch {
      /* ignore */
    }
  }, [openFacets])

  const [facetSearch, setFacetSearch] = useState<FacetSearchState>({ brand: '', supplier: '' })
  const debouncedFacetSearch = {
    brand: useDebounce(facetSearch.brand, 200),
    supplier: useDebounce(facetSearch.supplier, 200),
  }

  const facetRefs = useMemo(
    () => ({
      search: React.createRef<HTMLDivElement>(),
      brand: React.createRef<HTMLDivElement>(),
      category: React.createRef<HTMLDivElement>(),
      supplier: React.createRef<HTMLDivElement>(),
      availability: React.createRef<HTMLDivElement>(),
      packSizeRange: React.createRef<HTMLDivElement>(),
      priceRange: React.createRef<HTMLDivElement>(),
      pricePerUnitRange: React.createRef<HTMLDivElement>(),
    }) satisfies Record<keyof FacetFilters, React.RefObject<HTMLDivElement>>,
    [],
  )

  const [packMin, setPackMin] = useState<string>(
    filters.packSizeRange?.min?.toString() ?? ''
  )
  const [packMax, setPackMax] = useState<string>(
    filters.packSizeRange?.max?.toString() ?? ''
  )
  const [isApplyingPackSize, setIsApplyingPackSize] = useState(false)

  const applyPackSizeRange = useCallback(async () => {
    setIsApplyingPackSize(true)
    const min = packMin ? Number(packMin) : undefined
    const max = packMax ? Number(packMax) : undefined
    
    // Simulate brief loading for UX
    await new Promise(resolve => setTimeout(resolve, 150))
    
    if (min === undefined && max === undefined) {
      onChange({ packSizeRange: undefined })
      announceToScreenReader('Pack size filter cleared')
    } else {
      onChange({ packSizeRange: { min, max } })
      announceToScreenReader(`Pack size filter applied: ${min ?? 'any'} to ${max ?? 'any'}`)
    }
    setIsApplyingPackSize(false)
  }, [packMin, packMax, onChange])

  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!focusedFacet) return
    if (focusedFacet in openFacets && !openFacets[focusedFacet as keyof FacetOpenState]) {
      setOpenFacets(state => ({ ...state, [focusedFacet]: true }))
    }
    const target = facetRefs[focusedFacet]
    if (target?.current) {
      const behavior = prefersReducedMotion ? 'auto' : 'smooth'
      requestAnimationFrame(() => {
        target.current?.scrollIntoView({ block: 'start', behavior })
      })
    }
  }, [focusedFacet, facetRefs, openFacets, prefersReducedMotion])

  const { data, isLoading } = useQuery({
    queryKey: ['catalogFacets', filters, inStock],
    queryFn: () =>
      fetchCatalogFacets({
        ...filters,
        ...(availability ? { availability } : {}),
      }),
  })

  const [packDraft, setPackDraft] = useState<{ min: string; max: string }>(() => ({
    min: filters.packSizeRange?.min != null ? String(filters.packSizeRange.min) : '',
    max: filters.packSizeRange?.max != null ? String(filters.packSizeRange.max) : '',
  }))

  useEffect(() => {
    setPackDraft({
      min: filters.packSizeRange?.min != null ? String(filters.packSizeRange.min) : '',
      max: filters.packSizeRange?.max != null ? String(filters.packSizeRange.max) : '',
    })
  }, [filters.packSizeRange?.min, filters.packSizeRange?.max])

  const parsePackDraft = useCallback(() => {
    const min = packDraft.min.trim()
    const max = packDraft.max.trim()
    const minValue = min.length ? Number(min) : undefined
    const maxValue = max.length ? Number(max) : undefined
    return {
      min:
        typeof minValue === 'number' && Number.isFinite(minValue) ? minValue : undefined,
      max:
        typeof maxValue === 'number' && Number.isFinite(maxValue) ? maxValue : undefined,
    }
  }, [packDraft])

  const draftValues = parsePackDraft()
  const currentMin = filters.packSizeRange?.min
  const currentMax = filters.packSizeRange?.max
  const packHasChanges =
    draftValues.min !== currentMin || draftValues.max !== currentMax
  const packHasAnyValue = draftValues.min != null || draftValues.max != null
  const packRangeInvalid =
    draftValues.min != null && draftValues.max != null && draftValues.min > draftValues.max

  const handleApplyPack = useCallback(() => {
    if (packRangeInvalid) return
    if (!packHasAnyValue) {
      batchedChange({ packSizeRange: undefined })
      return
    }
    batchedChange({
      packSizeRange: {
        ...(draftValues.min != null ? { min: draftValues.min } : {}),
        ...(draftValues.max != null ? { max: draftValues.max } : {}),
      },
    })
  }, [batchedChange, draftValues, packHasAnyValue, packRangeInvalid])

  const renderFacetOption = useCallback(
    (
      facetKey: FacetKey,
      item: { id: string; name: string; count: number },
    ) => {
      const current = (filters as Record<string, unknown>)[facetKey]
      
      // Determine if item is included or excluded
      let state: 'include' | 'exclude' | null = null
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        const obj = current as { include?: string[]; exclude?: string[] }
        if (obj.include?.includes(item.id)) state = 'include'
        else if (obj.exclude?.includes(item.id)) state = 'exclude'
      }

      const label = item.name || t('facets.unknown', { defaultValue: 'Unknown' })

      const handleClick = () => {
        const currentObj = current as { include: string[]; exclude: string[] } | undefined
        const include = currentObj?.include ?? []
        const exclude = currentObj?.exclude ?? []

        // Cycle: null → include → exclude → null
        if (state === null) {
          // Add to include
          batchedChange({ 
            [facetKey]: { include: [...include, item.id], exclude } 
          } as Partial<FacetFilters>)
        } else if (state === 'include') {
          // Move to exclude
          batchedChange({ 
            [facetKey]: { include: include.filter(id => id !== item.id), exclude: [...exclude, item.id] }
          } as Partial<FacetFilters>)
        } else {
          // Remove entirely
          const newInclude = include.filter(id => id !== item.id)
          const newExclude = exclude.filter(id => id !== item.id)
          if (newInclude.length === 0 && newExclude.length === 0) {
            batchedChange({ [facetKey]: undefined } as Partial<FacetFilters>)
          } else {
            batchedChange({ [facetKey]: { include: newInclude, exclude: newExclude } } as Partial<FacetFilters>)
          }
        }
      }

      return (
        <button
          key={`${facetKey}-${item.id}`}
          type="button"
          onClick={handleClick}
          className={cn(
            "w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition",
            state === 'include' && "bg-[color:var(--chip-bg)] text-[color:var(--ink-hi)]",
            state === 'exclude' && "bg-destructive/10 text-destructive",
            state === null && "hover:bg-[color:var(--chip-bg)]/60"
          )}
        >
          <span className="flex items-center gap-2">
            {state === 'exclude' && <span className="text-xs">−</span>}
            <span className="truncate" title={label}>
              {label}
            </span>
          </span>
          <span className="text-xs font-semibold text-[color:var(--ink-dim)]/80">
            {item.count}
          </span>
        </button>
      )
    },
    [batchedChange, filters, t],
  )

  const facets = useMemo(
    () => [
      {
        key: 'category' as FacetKey,
        label: t('facets.categories'),
        items: data?.categories ?? [],
      },
      {
        key: 'supplier' as FacetKey,
        label: t('facets.suppliers'),
        items: data?.suppliers ?? [],
        searchable: true,
      },
      {
        key: 'brand' as FacetKey,
        label: t('facets.brands'),
        items: data?.brands ?? [],
        searchable: true,
      },
    ],
    [data?.brands, data?.categories, data?.suppliers, t],
  )

  const skeletonRows = Array.from({ length: 6 })

  const headerSurfaceClass = cn(
    'flex flex-col gap-3 border-b border-white/10 bg-[color:var(--toolbar-bg)]/80 px-4 py-4 backdrop-blur-xl',
    variant === 'desktop' ? 'shadow-[0_10px_30px_rgba(8,15,26,0.22)]' : '',
  )

  const panelBodyClass = cn(
    'flex-1 space-y-6 overflow-y-auto px-4 pb-6',
    variant === 'desktop' ? 'pt-4' : 'pt-2'
  )

  const headerTokens = useMemo<HeaderVars>(() => ({
    '--ctrl-h': '32px',
    '--ctrl-r': '10px',
  }), [])

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-[color:var(--surface-raised,hsl(var(--background)))]',
        variant === 'desktop' && 'lg:max-h-[calc(100vh-var(--header-h,64px))]'
      )}
    >
      {/* Sticky header with title, clear all, and Tier-1 toggles */}
      <div 
        className="sticky top-0 z-10 bg-[color:var(--surface-raised-strong)] backdrop-blur-md border-b border-[color:var(--ring-idle)]/40"
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div className={headerSurfaceClass} style={headerTokens}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[color:var(--ink-hi)]">
              {t('title')}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
              className="h-8 px-3 text-sm font-medium text-[color:var(--ink-dim)] hover:text-[color:var(--ink)]"
            >
              {t('actions.clear')}
            </Button>
          </div>
        </div>
        
        {/* Tier-1 Quick Filters - Always visible */}
        <div className="px-4 pb-3 pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-in-stock"
              checked={inStock}
              onCheckedChange={setInStock}
            />
            <label
              htmlFor="filter-in-stock"
              className="text-sm font-medium text-[color:var(--ink)] cursor-pointer select-none"
            >
              {t('stock.inStockOnly', { defaultValue: 'Only in stock' })}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-my-suppliers"
              checked={mySuppliers}
              onCheckedChange={setMySuppliers}
            />
            <label
              htmlFor="filter-my-suppliers"
              className="text-sm font-medium text-[color:var(--ink)] cursor-pointer select-none"
            >
              {t('suppliers.myOnly', { defaultValue: 'My suppliers only' })}
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-on-special"
              checked={onSpecial}
              onCheckedChange={setOnSpecial}
            />
            <label
              htmlFor="filter-on-special"
              className="text-sm font-medium text-[color:var(--ink)] cursor-pointer select-none"
            >
              {t('specials.onlySpecials', { defaultValue: 'On special only' })}
            </label>
          </div>
        </div>
      </div>

      {/* Scrollable content area - Tier-2 Facets */}
      <div className={panelBodyClass}>
        <FilterPresets className="pb-4 border-b border-[color:var(--ring-idle)]/40" />
        
        <section className="space-y-4">
          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="space-y-2 pb-4 border-b border-[color:var(--ring-idle)]/40">
              <span className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-dim)]/70">
                {t('activeFilters', { defaultValue: 'Active filters' })}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {chips.map(chip => (
                  <FilterChip
                    key={chip.key}
                    selected
                    onClick={chip.onEdit}
                    onRemove={chip.onRemove}
                    className="shrink-0"
                  >
                    {chip.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          )}
          
          {/* Facet filters section - Categories, Suppliers, Brands, etc. */}
        </section>

        <section className="space-y-4">
          {isLoading && (
            <div className="space-y-4">
              {skeletonRows.map((_, index) => (
                <div key={`skeleton-${index}`} className="space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
                  <div className="space-y-2 rounded-xl border border-white/5 p-3">
                    {Array.from({ length: 3 }).map((__, inner) => (
                      <div key={inner} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="h-4 w-4 rounded border border-white/20" />
                          <div className="h-3 w-32 animate-pulse rounded-full bg-white/10" />
                        </div>
                        <div className="h-3 w-10 animate-pulse rounded-full bg-white/10" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading &&
            facets.map(({ key, label, items, searchable }) => {
              const isOpen = openFacets[key]
              const searchValue = searchable ? debouncedFacetSearch[key as keyof FacetSearchState] : ''
              return (
                <article
                  key={key}
                  ref={facetRefs[key]}
                  className="rounded-2xl border border-white/8 bg-white/4 p-3"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-sm font-semibold text-[color:var(--ink-hi)] transition hover:bg-white/5"
                    aria-expanded={isOpen}
                    aria-controls={`facet-${key}`}
                    onClick={() =>
                      setOpenFacets(state => ({ ...state, [key]: !state[key] }))
                    }
                  >
                    <span>{label}</span>
                    <CaretDown
                      size={18}
                      className={cn(
                        'shrink-0 text-[color:var(--ink-dim)]/80 transition-transform duration-150 ease-out',
                        isOpen ? 'rotate-0' : '-rotate-90'
                      )}
                      aria-hidden
                    />
                  </button>

                  {isOpen && (
                    <div id={`facet-${key}`} className="mt-3 space-y-3">
                      {searchable && (
                        <Input
                          value={facetSearch[key as keyof FacetSearchState]}
                          onChange={event =>
                            setFacetSearch(state => ({
                              ...state,
                              [key]: event.target.value,
                            }))
                          }
                          placeholder={t('facets.searchPlaceholder', {
                            defaultValue: 'Search in list…',
                          })}
                          className="h-9 w-full rounded-lg border-white/10 bg-white/10 text-sm text-[color:var(--ink-hi)] placeholder:text-[color:var(--ink-dim)]/60"
                          autoComplete="off"
                        />
                      )}
                      <FacetList
                        facetKey={key}
                        items={items}
                        searchTerm={searchValue}
                        renderOption={item => renderFacetOption(key, item)}
                        emptyLabel={t('facets.empty', { defaultValue: 'No matches' })}
                        className="space-y-1"
                      />
                    </div>
                  )}
                </article>
              )
            })}

          <article ref={facetRefs.packSizeRange} className="rounded-2xl border border-white/8 bg-white/4 p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left text-sm font-semibold text-[color:var(--ink-hi)] transition hover:bg-white/5"
              aria-expanded={openFacets.packSizeRange}
              aria-controls="facet-pack"
              onClick={() =>
                setOpenFacets(state => ({
                  ...state,
                  packSizeRange: !state.packSizeRange,
                }))
              }
            >
              <span>{t('packSize.label')}</span>
              <CaretDown
                size={18}
                className={cn(
                  'shrink-0 text-[color:var(--ink-dim)]/80 transition-transform duration-150 ease-out',
                  openFacets.packSizeRange ? 'rotate-0' : '-rotate-90'
                )}
                aria-hidden
              />
            </button>

            {openFacets.packSizeRange && (
              <div id="facet-pack" className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={packDraft.min}
                    onChange={event =>
                      setPackDraft(state => ({ ...state, min: event.target.value }))
                    }
                    onKeyDown={event => {
                      if (event.key === 'Enter') handleApplyPack()
                    }}
                    placeholder={t('packSize.placeholders.min')}
                    className="h-10 flex-1 rounded-lg border-white/10 bg-white/10 text-sm text-[color:var(--ink-hi)] placeholder:text-[color:var(--ink-dim)]/60"
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={packDraft.max}
                    onChange={event =>
                      setPackDraft(state => ({ ...state, max: event.target.value }))
                    }
                    onKeyDown={event => {
                      if (event.key === 'Enter') handleApplyPack()
                    }}
                    placeholder={t('packSize.placeholders.max')}
                    className="h-10 flex-1 rounded-lg border-white/10 bg-white/10 text-sm text-[color:var(--ink-hi)] placeholder:text-[color:var(--ink-dim)]/60"
                  />
                </div>
                {packRangeInvalid && (
                  <p className="text-xs font-medium text-red-300">
                    {t('packSize.validation.invalid')}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleApplyPack}
                    disabled={!packHasChanges || packRangeInvalid || isApplyingPackSize}
                    className="h-9 px-4"
                  >
                    {isApplyingPackSize ? t('packSize.actions.applying', { defaultValue: 'Applying...' }) : t('packSize.actions.apply')}
                  </Button>
                  {packHasAnyValue && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => batchedChange({ packSizeRange: undefined })}
                    >
                      {t('packSize.actions.reset')}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </article>

          {/* Advanced Filters Section */}
          <AdvancedFilters />
        </section>
      </div>
    </div>
  )
}

interface FacetListProps {
  facetKey: FacetKey
  items: { id: string; name: string; count: number }[]
  searchTerm?: string
  renderOption: (item: { id: string; name: string; count: number }) => React.ReactNode
  emptyLabel: string
  className?: string
}

function FacetList({
  facetKey,
  items,
  searchTerm,
  renderOption,
  emptyLabel,
  className,
}: FacetListProps) {
  const filtered = useMemo(() => {
    if (!searchTerm) return items
    const needle = searchTerm.toLowerCase()
    return items.filter(item => (item.name || '').toLowerCase().includes(needle))
  }, [items, searchTerm])

  const shouldVirtualize = filtered.length >= VIRTUALIZE_THRESHOLD
  const parentRef = useRef<HTMLDivElement | null>(null)
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filtered.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 12,
  })

  if (!filtered.length) {
    return (
      <div className={cn('rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-[color:var(--ink-dim)]', className)}>
        {emptyLabel}
      </div>
    )
  }

  if (!shouldVirtualize) {
    return (
      <div className={cn('space-y-1', className)}>
        {filtered.map(item => (
          <React.Fragment key={`${facetKey}-${item.id}`}>
            {renderOption(item)}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <div ref={parentRef} className={cn('max-h-64 overflow-y-auto', className)}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualRow => {
          const item = filtered[virtualRow.index]
          return (
            <div
              key={`${facetKey}-${item.id}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderOption(item)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CatalogFiltersPanel
