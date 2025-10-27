import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { rememberScroll, restoreScroll } from '@/lib/scrollMemory'
import { useDebounce } from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { InfiniteSentinel } from '@/components/common/InfiniteSentinel'
import { FilterChip } from '@/components/ui/filter-chip'
import {
  CatalogFiltersPanel,
  type ActiveFilterChip,
} from '@/components/catalog/CatalogFiltersPanel'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FacetFilters, PublicCatalogFilters, OrgCatalogFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { Sheet, SheetContent, SheetPortal } from '@/components/ui/sheet'
import { useCatalogFilters, SortOrder } from '@/state/catalogFiltersStore'
import { useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, FunnelSimple, XCircle } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'
import { useGatedAction } from '@/hooks/useGatedAction'
import { SignUpPromptModal } from '@/components/auth/SignUpPromptModal'
import { useBasket } from '@/contexts/useBasket'

const FILTER_PANEL_LS_KEY = 'catalog-filters-open'

const COMPACT_TOOLBAR_TOKENS = {
  '--ctrl-h': '36px',
  '--ctrl-r': '10px',
  '--icon-btn': '36px',
} as React.CSSProperties

interface CatalogShellProps {
  mode: 'public' | 'authenticated'
}

interface DerivedChip {
  key: string
  label: string
  variant: 'boolean' | 'range' | 'multi' | 'text' | 'default'
  summary?: string
  hasPopover?: boolean
  onRemove: () => void
  onEdit: () => void
}

function deriveChipsFromFilters(
  filters: FacetFilters,
  setFilters: (f: Partial<FacetFilters>) => void,
  openFacet: (facet: keyof FacetFilters) => void,
  inStock: boolean,
  setInStock: (v: boolean) => void,
  onSpecial: boolean,
  setOnSpecial: (v: boolean) => void,
  mySuppliers: boolean,
  setMySuppliers: (v: boolean) => void,
): DerivedChip[] {
  const chips: DerivedChip[] = []

  // Boolean filters first (highest priority)
  if (inStock) {
    chips.push({
      key: 'inStock',
      label: 'In Stock',
      variant: 'boolean',
      onRemove: () => setInStock(false),
      onEdit: () => {},
    })
  }

  if (onSpecial) {
    chips.push({
      key: 'onSpecial',
      label: 'On Special',
      variant: 'boolean',
      onRemove: () => setOnSpecial(false),
      onEdit: () => {},
    })
  }

  if (mySuppliers) {
    chips.push({
      key: 'mySuppliers',
      label: 'My Suppliers',
      variant: 'boolean',
      onRemove: () => setMySuppliers(false),
      onEdit: () => {},
    })
  }

  const totalCategories = (filters.category?.include?.length || 0) + (filters.category?.exclude?.length || 0)
  if (totalCategories > 0) {
    if (totalCategories <= 2) {
      filters.category?.include?.forEach(id => {
        chips.push({
          key: `category-include-${id}`,
          label: id,
          variant: 'multi',
          onRemove: () =>
            setFilters({
              category: {
                include: filters.category!.include.filter(c => c !== id),
                exclude: filters.category!.exclude
              }
            }),
          onEdit: () => openFacet('category'),
        })
      })
      filters.category?.exclude?.forEach(id => {
        chips.push({
          key: `category-exclude-${id}`,
          label: `− ${id}`,
          variant: 'multi',
          onRemove: () =>
            setFilters({
              category: {
                include: filters.category!.include,
                exclude: filters.category!.exclude.filter(c => c !== id)
              }
            }),
          onEdit: () => openFacet('category'),
        })
      })
    } else {
      const firstTwo = filters.category!.include.slice(0, 2)
      const remaining = totalCategories - 2
      chips.push({
        key: 'category',
        label: remaining > 0 ? `Categories: ${firstTwo.join(', ')} +${remaining}` : `Categories (${totalCategories})`,
        variant: 'multi',
        summary: [...(filters.category?.include || []), ...(filters.category?.exclude || [])].join(', '),
        hasPopover: true,
        onRemove: () => setFilters({ category: undefined }),
        onEdit: () => openFacet('category'),
      })
    }
  }

  // Add similar logic for suppliers, brands, pack size, etc.
  const totalSuppliers = (filters.supplier?.include?.length || 0) + (filters.supplier?.exclude?.length || 0)
  if (totalSuppliers > 0) {
    if (totalSuppliers <= 2) {
      filters.supplier?.include?.forEach(id => {
        chips.push({
          key: `supplier-include-${id}`,
          label: id,
          variant: 'multi',
          onRemove: () =>
            setFilters({
              supplier: {
                include: filters.supplier!.include.filter(s => s !== id),
                exclude: filters.supplier!.exclude
              }
            }),
          onEdit: () => openFacet('supplier'),
        })
      })
      filters.supplier?.exclude?.forEach(id => {
        chips.push({
          key: `supplier-exclude-${id}`,
          label: `− ${id}`,
          variant: 'multi',
          onRemove: () =>
            setFilters({
              supplier: {
                include: filters.supplier!.include,
                exclude: filters.supplier!.exclude.filter(s => s !== id)
              }
            }),
          onEdit: () => openFacet('supplier'),
        })
      })
    } else {
      const firstTwo = filters.supplier!.include.slice(0, 2)
      const remaining = totalSuppliers - 2
      chips.push({
        key: 'supplier',
        label: remaining > 0 ? `Suppliers: ${firstTwo.join(', ')} +${remaining}` : `Suppliers (${totalSuppliers})`,
        variant: 'multi',
        summary: [...(filters.supplier?.include || []), ...(filters.supplier?.exclude || [])].join(', '),
        hasPopover: true,
        onRemove: () => setFilters({ supplier: undefined }),
        onEdit: () => openFacet('supplier'),
      })
    }
  }

  const totalBrands = (filters.brand?.include?.length || 0) + (filters.brand?.exclude?.length || 0)
  if (totalBrands > 0) {
    if (totalBrands <= 2) {
      filters.brand?.include?.forEach(id => {
        chips.push({
          key: `brand-include-${id}`,
          label: id,
          variant: 'multi',
          onRemove: () => setFilters({
            brand: {
              include: filters.brand!.include.filter(b => b !== id),
              exclude: filters.brand!.exclude
            }
          }),
          onEdit: () => openFacet('brand'),
        })
      })
      filters.brand?.exclude?.forEach(id => {
        chips.push({
          key: `brand-exclude-${id}`,
          label: `− ${id}`,
          variant: 'multi',
          onRemove: () => setFilters({
            brand: {
              include: filters.brand!.include,
              exclude: filters.brand!.exclude.filter(b => b !== id)
            }
          }),
          onEdit: () => openFacet('brand'),
        })
      })
    } else {
      const firstTwo = filters.brand!.include.slice(0, 2)
      const remaining = totalBrands - 2
      chips.push({
        key: 'brand',
        label: remaining > 0 ? `Brands: ${firstTwo.join(', ')} +${remaining}` : `Brands (${totalBrands})`,
        variant: 'multi',
        summary: [...(filters.brand?.include || []), ...(filters.brand?.exclude || [])].join(', '),
        hasPopover: true,
        onRemove: () => setFilters({ brand: undefined }),
        onEdit: () => openFacet('brand'),
      })
    }
  }

  if (filters.packSizeRange) {
    const { min, max } = filters.packSizeRange
    let label = 'Pack: '
    if (min != null && max != null) label += `${min}-${max}`
    else if (min != null) label += `≥ ${min}`
    else if (max != null) label += `≤ ${max}`
    chips.push({
      key: 'packSizeRange',
      label,
      variant: 'range',
      hasPopover: true,
      onRemove: () => setFilters({ packSizeRange: undefined }),
      onEdit: () => openFacet('packSizeRange'),
    })
  }

  return chips
}

export function CatalogShell({ mode }: CatalogShellProps) {
  const isPublicMode = mode === 'public'
  const { user, profile } = useAuth()
  const orgId = isPublicMode ? '' : (profile?.tenant_id || '')
  const { addItem } = useBasket()
  const { gateAction, showAuthModal, closeAuthModal, pendingActionName } = useGatedAction()

  // Direct access to avoid shallow comparison issues
  const filters = useCatalogFilters(s => s.filters)
  const setFilters = useCatalogFilters(s => s.setFilters)
  const onlyWithPrice = useCatalogFilters(s => s.onlyWithPrice)
  const setOnlyWithPrice = useCatalogFilters(s => s.setOnlyWithPrice)
  const sortOrder = useCatalogFilters(s => s.sort)
  const setSortOrder = useCatalogFilters(s => s.setSort)
  const inStock = useCatalogFilters(s => s.inStock)
  const setInStock = useCatalogFilters(s => s.setInStock)
  const onSpecial = useCatalogFilters(s => s.onSpecial)
  const setOnSpecial = useCatalogFilters(s => s.setOnSpecial)
  const mySuppliers = useCatalogFilters(s => s.mySuppliers)
  const setMySuppliers = useCatalogFilters(s => s.setMySuppliers)

  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<'grid' | 'list'>(() => {
    const param = searchParams.get('view')
    if (param === 'grid' || param === 'list') return param
    try {
      const stored = localStorage.getItem('catalog:view')
      if (stored === 'grid' || stored === 'list') return stored
    } catch {
      /* ignore */
    }
    return 'grid'
  })
  const viewKey = `catalog:${view}`
  const [addingId, setAddingId] = useState<string | null>(null)
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'supplier' | 'price' | 'availability'
    direction: 'asc' | 'desc'
  } | null>({ key: 'name', direction: 'asc' })
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const [showFilters, setShowFilters] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(FILTER_PANEL_LS_KEY)
      if (stored !== null) {
        return stored === 'true'
      }
    } catch {
      /* ignore */
    }
    return false
  })
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const desktopFiltersOpen = isDesktop && showFilters
  const [focusedFacet, setFocusedFacet] = useState<keyof FacetFilters | null>(null)
  const clearAllFilters = useCallback(() => {
    setInStock(false)
    setMySuppliers(false)
    setOnSpecial(false)
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
      availability: undefined,
      priceRange: undefined,
      pricePerUnitRange: undefined,
      dietary: undefined,
      quality: undefined,
      operational: undefined,
      lifecycle: undefined,
      dataQuality: undefined,
    })
    setFocusedFacet(null)
  }, [
    setFilters,
    setFocusedFacet,
    setOnlyWithPrice,
    setOnSpecial,
    setInStock,
    setMySuppliers,
  ])
  const stringifiedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement | null>(null)
  const focusFilterToggleButton = useCallback(() => {
    filterButtonRef.current?.focus()
  }, [filterButtonRef])
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('catalog:view', view)
    } catch {
      /* ignore */
    }
  }, [view])

  useEffect(() => {
    restoreScroll(viewKey)
  }, [viewKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const updateScrolled = () => {
      const shouldBeScrolled = window.scrollY > 0
      setScrolled(prev => (prev === shouldBeScrolled ? prev : shouldBeScrolled))
    }
    updateScrolled()
    window.addEventListener('scroll', updateScrolled, { passive: true })
    return () => window.removeEventListener('scroll', updateScrolled)
  }, [])

  useEffect(() => {
    if (sortOrder === 'az') {
      setTableSort({ key: 'name', direction: 'asc' })
    } else {
      setTableSort(null)
    }
  }, [sortOrder])

  const availability = inStock ? ['IN_STOCK'] : undefined

  const publicFilters: PublicCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      ...(onlyWithPrice ? { onlyWithPrice: true } : {}),
      ...(onSpecial ? { onSpecial: true } : {}),
      ...(availability ? { availability } : {}),
    }),
    [filters, debouncedSearch, onlyWithPrice, onSpecial, availability],
  )
  const orgFilters: OrgCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      onlyWithPrice,
      ...(mySuppliers ? { mySuppliers: 'include' as const } : {}),
      ...(onSpecial ? { onSpecial: true } : {}),
      ...(availability ? { availability } : {}),
    }),
    [
      filters,
      debouncedSearch,
      onlyWithPrice,
      mySuppliers,
      onSpecial,
      availability,
    ],
  )

  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)

  // Use data directly from the appropriate hook
  const currentQuery = isPublicMode ? publicQuery : (orgId ? orgQuery : publicQuery)
  const products = useMemo(() => currentQuery.data ?? [], [currentQuery.data])
  const totalCount = currentQuery.total
  const isFetching = currentQuery.isFetching
  const error = currentQuery.error
  const {
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    isLoading: queryLoading,
    refetch,
  } = currentQuery

  const isInitialLoading = (queryLoading || isFetching) && products.length === 0
  const isLoadingMore = isFetchingNextPage

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      loadMore()
    }
  }, [hasNextPage, isFetchingNextPage, loadMore])

  const sortedProducts = useMemo(() => {
    if (!tableSort) return products
    const sorted = [...products]
    const availabilityOrder: Record<string, number> = {
      IN_STOCK: 0,
      LOW_STOCK: 1,
      OUT_OF_STOCK: 2,
      UNKNOWN: 3,
    }
    sorted.sort((a, b) => {
      let av: any
      let bv: any
      switch (tableSort.key) {
        case 'supplier':
          av = (a.supplier_ids?.[0] || '').toLowerCase()
          bv = (b.supplier_ids?.[0] || '').toLowerCase()
          break
        case 'price':
          av = a.best_price ?? (tableSort.direction === 'asc' ? Infinity : -Infinity)
          bv = b.best_price ?? (tableSort.direction === 'asc' ? Infinity : -Infinity)
          break
        case 'availability':
          av = availabilityOrder[a.availability_status] ?? 3
          bv = availabilityOrder[b.availability_status] ?? 3
          break
        default:
          av = (a.name || '').toLowerCase()
          bv = (b.name || '').toLowerCase()
      }
      if (av < bv) return tableSort.direction === 'asc' ? -1 : 1
      if (av > bv) return tableSort.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [products, tableSort])

  const displayProducts = view === 'list' ? sortedProducts : products
  const brandTotal = (filters.brand?.include?.length || 0) + (filters.brand?.exclude?.length || 0)
  const categoryTotal = (filters.category?.include?.length || 0) + (filters.category?.exclude?.length || 0)
  const supplierTotal = (filters.supplier?.include?.length || 0) + (filters.supplier?.exclude?.length || 0)
  const hasFacetFilters = Boolean(
    brandTotal > 0 ||
      categoryTotal > 0 ||
      supplierTotal > 0 ||
      filters.packSizeRange ||
      filters.priceRange ||
      filters.pricePerUnitRange ||
      (filters.dietary && filters.dietary.length > 0) ||
      (filters.quality && filters.quality.length > 0) ||
      filters.operational ||
      (filters.lifecycle && filters.lifecycle.length > 0) ||
      filters.dataQuality,
  )
  const hasSearchQuery = Boolean((filters.search ?? '').trim().length)
  const hasAnyFilters =
    hasFacetFilters ||
    hasSearchQuery ||
    onlyWithPrice ||
    inStock ||
    mySuppliers ||
    onSpecial

  const handleAdd = useCallback(
    (product: any, supplierId?: string) => {
      if (isPublicMode) {
        gateAction(() => {}, product.name)
        return
      }

      const firstSupplierId = supplierId || product.supplier_ids?.[0]
      if (!firstSupplierId) return

      setAddingId(product.catalog_id)
      addItem({
        product_id: product.catalog_id,
        supplier_id: firstSupplierId,
        quantity: 1,
      })
      setTimeout(() => setAddingId(null), 800)
    },
    [isPublicMode, gateAction, addItem],
  )

  const handleSort = useCallback(
    (key: 'name' | 'supplier' | 'price' | 'availability') => {
      if (tableSort?.key === key) {
        setTableSort({
          key,
          direction: tableSort.direction === 'asc' ? 'desc' : 'asc',
        })
      } else {
        setTableSort({ key, direction: 'asc' })
      }
    },
    [tableSort],
  )

  const chips = useMemo(
    () =>
      deriveChipsFromFilters(
        filters,
        setFilters,
        setFocusedFacet,
        inStock,
        setInStock,
        onSpecial,
        setOnSpecial,
        mySuppliers,
        setMySuppliers,
      ),
    [filters, inStock, onSpecial, mySuppliers],
  )

  const activeFacetCount = chips.length
  const activeCount =
    (inStock ? 1 : 0) +
    (mySuppliers ? 1 : 0) +
    (onSpecial ? 1 : 0) +
    activeFacetCount

  const closeFilters = useCallback(() => {
    setShowFilters(false)
    setFocusedFacet(null)
  }, [])

  const searchRef = useRef<HTMLInputElement>(null)
  const searchValue = filters.search ?? ''
  const showClear = searchValue.length > 0

  const formattedTotal = useMemo(() => {
    if (typeof totalCount === 'number' && Number.isFinite(totalCount)) {
      try {
        return new Intl.NumberFormat().format(totalCount)
      } catch {
        return String(totalCount)
      }
    }
    return null
  }, [totalCount])

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ search: event.target.value })
    },
    [setFilters],
  )

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && searchValue) {
        event.preventDefault()
        setFilters({ search: '' })
        return
      }
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === 'Backspace' || event.key === 'Delete')
      ) {
        event.preventDefault()
        if (searchValue) {
          setFilters({ search: '' })
        }
      }
    },
    [searchValue, setFilters],
  )

  const handleClearSearch = useCallback(() => {
    setFilters({ search: '' })
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [setFilters])

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_PANEL_LS_KEY, showFilters ? 'true' : 'false')
    } catch {
      /* ignore */
    }
  }, [showFilters])

  const previousShowFiltersRef = useRef(showFilters)
  useEffect(() => {
    if (previousShowFiltersRef.current && !showFilters) {
      focusFilterToggleButton()
    }
    previousShowFiltersRef.current = showFilters
  }, [showFilters, focusFilterToggleButton])

  const toggleFilters = useCallback(() => {
    const next = !showFilters
    if (next) {
      const { search: _search, ...facetFilters } = filters
      const first = Object.entries(facetFilters).find(([, v]) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v),
      )?.[0] as keyof FacetFilters | undefined
      setFocusedFacet(first ?? null)
    } else {
      setFocusedFacet(null)
    }
    setShowFilters(next)
  }, [showFilters, filters, setFocusedFacet, setShowFilters])

  const renderFiltersToggleButton = useCallback(
    (extraClassName?: string) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleFilters}
            aria-pressed={showFilters}
            aria-expanded={showFilters}
            aria-controls="catalog-filters-panel"
            aria-keyshortcuts="f"
            className={cn(
              'inline-flex h-[var(--ctrl-h,40px)] items-center gap-3 rounded-[var(--ctrl-r,12px)] border border-transparent bg-[color:var(--chip-bg)] px-3 text-sm font-semibold text-[color:var(--ink-hi)] backdrop-blur-xl transition duration-200 ease-out focus-visible:outline-none hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] motion-reduce:transition-none',
              showFilters && 'bg-[color:var(--seg-active-bg)] text-[color:var(--ink-hi)] border-[color:var(--ring-hover)]',
              extraClassName,
            )}
            ref={filterButtonRef ?? undefined}
          >
            <FunnelSimple
              size={24}
              weight="fill"
              className={cn('transition-opacity text-[color:var(--ink-hi)]', !showFilters && 'opacity-80')}
            />
            <span className="hidden sm:inline">
              {activeCount ? `Filters (${activeCount})` : 'Filters'}
            </span>
            <span className="sm:hidden">Filters</span>
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Filters (F)</TooltipContent>
      </Tooltip>
    ),
    [toggleFilters, showFilters, activeCount, filterButtonRef],
  )

  const containerClass = 'mx-auto w-full max-w-[1600px]'
  
  return (
    <>
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <section
          style={{
            ...COMPACT_TOOLBAR_TOKENS,
            paddingInline: 'var(--page-gutter)',
          }}
          className={cn(
            'relative bg-[color:var(--toolbar-bg)] backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/12 after:content-[""]',
            scrolled && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/16 before:opacity-70 before:content-[""]',
          )}
        >
          {error && (
            <div
              className={cn(containerClass, 'py-3')}
              style={{ paddingInline: 'clamp(1.5rem, 4vw, 4rem)' }}
            >
              <Alert
                variant="destructive"
                className="rounded-[var(--ctrl-r,12px)] bg-white/12 text-[color:var(--ink)] ring-1 ring-inset ring-white/15 shadow-[0_16px_36px_rgba(3,10,22,0.45)] backdrop-blur-xl"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{String(error)}</AlertDescription>
              </Alert>
            </div>
          )}

          <div
            className={containerClass}
            style={{ paddingInline: 'clamp(1.5rem, 4vw, 4rem)' }}
          >
            <div className="catalog-toolbar flex flex-col gap-3 py-3">
              <div className="catalog-toolbar-zones">
                <div className="toolbar-left">
                  {renderFiltersToggleButton('flex-none')}
                </div>

                <div className="toolbar-center flex min-w-[220px] items-center gap-3">
                  <div className="relative flex-1">
                    <label className="sr-only" htmlFor="catalog-search">
                      Search products
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <input
                          id="catalog-search"
                          ref={searchRef}
                          type="search"
                          placeholder="Search products"
                          aria-keyshortcuts="Control+K Meta+K"
                          value={searchValue}
                          onChange={handleSearchChange}
                          onKeyDown={handleSearchKeyDown}
                          className="h-[var(--ctrl-h,40px)] w-full rounded-[var(--ctrl-r,12px)] border-transparent bg-[color:var(--chip-bg)] px-12 text-sm text-[color:var(--ink-hi)] placeholder-[color:var(--ink-dim)]/60 backdrop-blur-xl transition duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-[color:var(--ring-focus)] motion-reduce:transition-none"
                        />
                      </TooltipTrigger>
                      <TooltipContent sideOffset={8}>Search (Ctrl/⌘+K)</TooltipContent>
                    </Tooltip>
                    <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center text-slate-500">
                      <MagnifyingGlass size={22} weight="fill" aria-hidden="true" />
                    </span>
                    {showClear && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition duration-150 ease-out hover:bg-slate-200/70 hover:text-slate-800 focus-visible:outline-none motion-reduce:transition-none"
                      >
                        <XCircle size={20} weight="fill" />
                      </button>
                    )}
                  </div>

                  {formattedTotal && (
                    <div className="hidden items-center text-sm font-semibold text-[color:var(--ink-hi)] lg:flex">
                      <span className="tabular-nums">{formattedTotal}</span>
                      <span className="ml-1 font-normal text-[color:var(--ink-lo)]">results</span>
                    </div>
                  )}
                </div>

                <div className="toolbar-right lg:flex-nowrap lg:gap-4">
                  <SortDropdown
                    value={sortOrder}
                    onChange={setSortOrder}
                    className="whitespace-nowrap"
                  />
                  <ViewToggle
                    value={view}
                    onChange={v => {
                      rememberScroll(`catalog:${view}`)
                      setView(v)
                    }}
                  />
                </div>
              </div>

              {(chips.length > 0 || activeCount > 0) && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {chips.map(chip => (
                    <FilterChip
                      key={chip.key}
                      variant={chip.variant}
                      hasPopover={chip.hasPopover}
                      summary={chip.summary}
                      onRemove={chip.onRemove}
                      onEdit={chip.onEdit}
                      className="flex-none"
                    >
                      {chip.label}
                    </FilterChip>
                  ))}

                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="flex-none whitespace-nowrap text-sm font-medium text-destructive/80 hover:text-destructive transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <div
          className={cn(
            'mx-auto w-full max-w-[1600px] space-y-5 pb-8 pt-2'
          )}
          style={{
            paddingInline: 'clamp(1.5rem, 4vw, 4rem)'
          }}
        >
          {isInitialLoading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
              <p className="text-sm font-medium text-slate-600">Loading catalog…</p>
            </div>
          ) : !displayProducts.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">No products found</h2>
              <p className="mt-2 text-sm text-slate-600">
                {hasAnyFilters
                  ? 'Try adjusting or clearing your search and filters to see more results.'
                  : 'We could not find any products to show right now. Try refreshing the catalog.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {hasAnyFilters && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      clearAllFilters()
                      setFilters({ search: '' })
                    }}
                  >
                    Clear filters
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {view === 'grid' ? (
                <CatalogGrid
                  products={displayProducts}
                  onAddToCart={handleAdd}
                  onNearEnd={handleLoadMore}
                  showPrice={!isPublicMode}
                  addingId={addingId}
                  mode={mode}
                />
              ) : (
                <CatalogTable
                  products={displayProducts}
                  sort={tableSort}
                  onSort={handleSort}
                />
              )}

              {hasNextPage && (
                <div className="flex flex-col items-center gap-3 py-6">
                  <InfiniteSentinel
                    onVisible={handleLoadMore}
                    disabled={!hasNextPage || isLoadingMore}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading more…' : 'Load more'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {isDesktop && showFilters && (
          <SheetPortal>
            <div
              role="presentation"
              data-state="open"
              className={cn(
                'fixed inset-y-0 right-0 bg-[color:var(--overlay)] backdrop-blur-sm',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                'z-[calc(var(--z-drawer,80)-1)]'
              )}
              style={{ left: 'var(--layout-rail,72px)' }}
              onClick={closeFilters}
            />
          </SheetPortal>
        )}
        {isDesktop && (
          <SheetContent
            side="left"
            hideOverlay
            className="hidden h-full p-0 bg-[color:var(--filters-bg)] lg:flex"
            style={{ left: 'var(--layout-rail,72px)', width: 'clamp(280px, 24vw, 360px)' }}
          >
            <div id="catalog-filters-panel" className="flex h-full w-full flex-col overflow-hidden min-h-0">
              <CatalogFiltersPanel
                filters={filters}
                onChange={setFilters}
                focusedFacet={focusedFacet}
                onClearFilters={clearAllFilters}
                chips={chips}
                mode={mode}
              />
            </div>
          </SheetContent>
        )}
      </Sheet>

      {showAuthModal && (
        <SignUpPromptModal
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          productName={pendingActionName}
        />
      )}
    </>
  )
}
