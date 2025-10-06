import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, X } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { rememberScroll, restoreScroll } from '@/lib/scrollMemory'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { InfiniteSentinel } from '@/components/common/InfiniteSentinel'
import { FilterChip } from '@/components/ui/filter-chip'
import { CatalogFiltersPanel } from '@/components/catalog/CatalogFiltersPanel'
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

import AppLayout from '@/components/layout/AppLayout'
import { useCatalogFilters, SortOrder } from '@/state/catalogFiltersStore'
import type { TriState } from '@/lib/catalogFilters'
import { triStockToAvailability } from '@/lib/catalogFilters'
import { useCart } from '@/contexts/useBasket'
import type { CartItem } from '@/lib/types'
import { resolveImage } from '@/lib/images'
import { useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, FunnelSimple, XCircle } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const FILTER_PANEL_LS_KEY = 'catalog-filters-open'
const CATALOG_CONTAINER_CLASS = 'mx-auto w-full max-w-[1600px] px-6 sm:px-10 lg:px-16'
const COMPACT_TOOLBAR_TOKENS = {
  '--ctrl-h': '36px',
  '--ctrl-r': '10px',
  '--icon-btn': '36px',
} as React.CSSProperties

interface DerivedChip {
  key: string
  label: string
  onRemove: () => void
  onEdit: () => void
}

function deriveChipsFromFilters(
  filters: FacetFilters,
  setFilters: (f: Partial<FacetFilters>) => void,
  openFacet: (facet: keyof FacetFilters) => void,
): DerivedChip[] {
  const chips: DerivedChip[] = []

  if (filters.category && filters.category.length) {
    if (filters.category.length <= 2) {
      filters.category.forEach(id => {
        chips.push({
          key: `category-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ category: filters.category!.filter(categoryId => categoryId !== id) }),
          onEdit: () => openFacet('category'),
        })
      })
    } else {
      chips.push({
        key: 'category',
        label: `Categories (${filters.category.length})`,
        onRemove: () => setFilters({ category: undefined }),
        onEdit: () => openFacet('category'),
      })
    }
  }

  if (filters.supplier && filters.supplier.length) {
    if (filters.supplier.length <= 2) {
      filters.supplier.forEach(id => {
        chips.push({
          key: `supplier-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ supplier: filters.supplier!.filter(supplierId => supplierId !== id) }),
          onEdit: () => openFacet('supplier'),
        })
      })
    } else {
      const [first, second, ...rest] = filters.supplier
      ;[first, second].forEach(id => {
        chips.push({
          key: `supplier-${id}`,
          label: id,
          onRemove: () =>
            setFilters({ supplier: filters.supplier!.filter(supplierId => supplierId !== id) }),
          onEdit: () => openFacet('supplier'),
        })
      })
      chips.push({
        key: 'supplier-extra',
        label: `Suppliers (+${rest.length})`,
        onRemove: () => setFilters({ supplier: undefined }),
        onEdit: () => openFacet('supplier'),
      })
    }
  }

  if (filters.brand && filters.brand.length) {
    if (filters.brand.length <= 2) {
      filters.brand.forEach(id => {
        chips.push({
          key: `brand-${id}`,
          label: id,
          onRemove: () => setFilters({ brand: filters.brand!.filter(brandId => brandId !== id) }),
          onEdit: () => openFacet('brand'),
        })
      })
    } else {
      chips.push({
        key: 'brand',
        label: `Brands (${filters.brand.length})`,
        onRemove: () => setFilters({ brand: undefined }),
        onEdit: () => openFacet('brand'),
      })
    }
  }

  if (filters.packSizeRange) {
    const { min, max } = filters.packSizeRange
    let label = 'Pack'
    if (min != null && max != null) label += ` ${min}-${max}`
    else if (min != null) label += ` ≥ ${min}`
    else if (max != null) label += ` ≤ ${max}`
    chips.push({
      key: 'packSizeRange',
      label,
      onRemove: () => setFilters({ packSizeRange: undefined }),
      onEdit: () => openFacet('packSizeRange'),
    })
  }

  return chips
}

export default function CatalogPage() {
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || ''

  // Direct access to avoid shallow comparison issues
  const filters = useCatalogFilters(s => s.filters)
  const setFilters = useCatalogFilters(s => s.setFilters)
  const onlyWithPrice = useCatalogFilters(s => s.onlyWithPrice)
  const setOnlyWithPrice = useCatalogFilters(s => s.setOnlyWithPrice)
  const sortOrder = useCatalogFilters(s => s.sort)
  const setSortOrder = useCatalogFilters(s => s.setSort)
  const triStock = useCatalogFilters(s => s.triStock)
  const setTriStock = useCatalogFilters(s => s.setTriStock)
  const triSpecial = useCatalogFilters(s => s.triSpecial)
  const setTriSpecial = useCatalogFilters(s => s.setTriSpecial)
  const triSuppliers = useCatalogFilters(s => s.triSuppliers)
  const setTriSuppliers = useCatalogFilters(s => s.setTriSuppliers)

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
  // Removed separate products state - using data directly from hooks
  const { addItem } = useCart()
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
  const [focusedFacet, setFocusedFacet] = useState<keyof FacetFilters | null>(null)
  const clearAllFilters = useCallback(() => {
    setTriStock('off')
    setTriSuppliers('off')
    setTriSpecial('off')
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
      availability: undefined,
    })
    setFocusedFacet(null)
  }, [
    setFilters,
    setFocusedFacet,
    setOnlyWithPrice,
    setTriSpecial,
    setTriStock,
    setTriSuppliers,
  ])
  const stringifiedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const filtersButtonRef = useRef<HTMLButtonElement>(null)
  const filtersHeadingRef = useRef<HTMLHeadingElement>(null)
  const wasFiltersOpen = useRef(showFilters)

  const closeFilters = useCallback(() => {
    setFocusedFacet(null)
    setShowFilters(false)
  }, [setFocusedFacet, setShowFilters])

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
    if (showFilters) {
      requestAnimationFrame(() => filtersHeadingRef.current?.focus())
    } else if (wasFiltersOpen.current) {
      requestAnimationFrame(() => filtersButtonRef.current?.focus())
    }
    wasFiltersOpen.current = showFilters
  }, [showFilters])

  useEffect(() => {
    if (!showFilters) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeFilters()
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const panel = document.getElementById('catalog-filters-panel')
      if (!panel) return
      const target = event.target as Node | null
      if (target && panel.contains(target)) return
      const toggleButton = filtersButtonRef.current
      if (toggleButton && target && toggleButton.contains(target)) return
      closeFilters()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [showFilters, closeFilters])

  // Will be calculated after products are defined
  // hideConnectPill will be calculated after products are defined

  // Read initial sort from URL on mount
  useEffect(() => {
    const param = searchParams.get('sort')
    if (param) setSortOrder(param as SortOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial stock filter from URL on mount
  useEffect(() => {
    const param = searchParams.get('stock')
    if (param === 'include' || param === 'exclude') {
      setTriStock(param as TriState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial facet filters and toggles from URL on mount
  useEffect(() => {
    const f: Partial<FacetFilters> = {}
    const categories = searchParams.get('categories')
    const brands = searchParams.get('brands')
    const suppliers = searchParams.get('suppliers')
    const pack = searchParams.get('pack')
    const search = searchParams.get('search')
    if (categories) f.category = categories.split(',').filter(Boolean)
    if (brands) f.brand = brands.split(',').filter(Boolean)
    if (suppliers) f.supplier = suppliers.split(',').filter(Boolean)
    if (pack) {
      const [minStr, maxStr] = pack.split('-')
      const min = minStr ? Number(minStr) : undefined
      const max = maxStr ? Number(maxStr) : undefined
      f.packSizeRange = { min, max }
    }
    if (Object.keys(f).length) setFilters(f)
    if (search && search.trim() && search !== filters.search) {
      setFilters({ search })
    }
    const suppliersParam = searchParams.get('mySuppliers')
    const specialParam = searchParams.get('special')
    if (suppliersParam === 'include' || suppliersParam === 'exclude') {
      setTriSuppliers(suppliersParam as TriState)
    }
    if (specialParam === 'include' || specialParam === 'exclude') {
      setTriSpecial(specialParam as TriState)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist sort selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('sort')
    if (sortOrder === 'relevance') {
      if (current) {
        params.delete('sort')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== sortOrder) {
      params.set('sort', sortOrder)
      setSearchParams(params, { replace: true })
    }
  }, [sortOrder, searchParams, setSearchParams])

  // Persist stock selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('stock')
    if (triStock === 'off') {
      if (current) {
        params.delete('stock')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triStock) {
      params.set('stock', triStock)
      setSearchParams(params, { replace: true })
    }
  }, [triStock, searchParams, setSearchParams])

  // Persist my suppliers selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('mySuppliers')
    if (triSuppliers === 'off') {
      if (current) {
        params.delete('mySuppliers')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triSuppliers) {
      params.set('mySuppliers', triSuppliers)
      setSearchParams(params, { replace: true })
    }
  }, [triSuppliers, searchParams, setSearchParams])

  // Persist special selection to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('special')
    if (triSpecial === 'off') {
      if (current) {
        params.delete('special')
        setSearchParams(params, { replace: true })
      }
    } else if (current !== triSpecial) {
      params.set('special', triSpecial)
      setSearchParams(params, { replace: true })
    }
  }, [triSpecial, searchParams, setSearchParams])

  // Persist facet filters to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let changed = false
    const updateParam = (key: string, value: string | null) => {
      const cur = params.get(key)
      if (value && cur !== value) {
        params.set(key, value)
        changed = true
      } else if (!value && cur) {
        params.delete(key)
        changed = true
      }
    }
    updateParam('categories', filters.category?.join(',') || null)
    updateParam('suppliers', filters.supplier?.join(',') || null)
    updateParam('brands', filters.brand?.join(',') || null)
    const packValue =
      filters.packSizeRange && (filters.packSizeRange.min != null || filters.packSizeRange.max != null)
        ? `${filters.packSizeRange.min ?? ''}-${filters.packSizeRange.max ?? ''}`
        : null
    updateParam('pack', packValue)
    if (changed) setSearchParams(params, { replace: true })
  }, [filters, searchParams, setSearchParams])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const current = params.get('search')
    const searchValue = filters.search && filters.search.trim() ? filters.search : null
    if (searchValue) {
      if (current !== searchValue) {
        params.set('search', searchValue)
        setSearchParams(params, { replace: true })
      }
    } else if (current) {
      params.delete('search')
      setSearchParams(params, { replace: true })
    }
  }, [filters.search, searchParams, setSearchParams])

  useEffect(() => {
    // No longer need to reset products here - hooks handle this internally
  }, [
    debouncedSearch,
    onlyWithPrice,
    orgId,
    triStock,
    triSuppliers,
    triSpecial,
    sortOrder,
    stringifiedFilters,
  ])

  useEffect(() => {
    if (sortOrder === 'az') {
      setTableSort({ key: 'name', direction: 'asc' })
    } else {
      setTableSort(null)
    }
  }, [sortOrder])

  const availability = triStockToAvailability(triStock)

  const publicFilters: PublicCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      ...(onlyWithPrice ? { onlyWithPrice: true } : {}),
      ...(triSpecial !== 'off'
        ? { onSpecial: triSpecial === 'include' }
        : {}),
      ...(availability ? { availability } : {}),
    }),
    [filters, debouncedSearch, onlyWithPrice, triSpecial, availability],
  )
  const orgFilters: OrgCatalogFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
      onlyWithPrice,
      ...(triSuppliers !== 'off' ? { mySuppliers: triSuppliers } : {}),
      ...(triSpecial !== 'off'
        ? { onSpecial: triSpecial === 'include' }
        : {}),
      ...(availability ? { availability } : {}),
    }),
    [
      filters,
      debouncedSearch,
      onlyWithPrice,
      triSuppliers,
      triSpecial,
      availability,
    ],
  )

  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)

  // Use data directly from the appropriate hook
  const currentQuery = orgId ? orgQuery : publicQuery
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

  const unconnectedPercentage = useMemo(() => {
    if (!products.length) return 0
    const missing = products.filter(product => {
      const supplierIds = Array.isArray(product?.supplier_ids)
        ? (product.supplier_ids as unknown[]).filter(
            (value): value is string => typeof value === 'string' && value.length > 0,
          )
        : []
      const supplierEntries: string[] = []
      const supplierProducts: string[] = []
      return (
        supplierIds.length === 0 &&
        supplierEntries.length === 0 &&
        supplierProducts.length === 0
      )
    }).length
    return (missing / products.length) * 100
  }, [products])
  
  const hideConnectPill = unconnectedPercentage > 70

  useEffect(() => {
    logFilter({
      ...filters,
      onlyWithPrice,
      triStock,
      mySuppliers: triSuppliers,
      sort: sortOrder,
    })
  }, [filters, onlyWithPrice, triStock, triSuppliers, sortOrder])

  useEffect(() => {
    if (debouncedSearch) logSearch(debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    if (filters.brand?.length) logFacetInteraction('brand', filters.brand.join(','))
    if (filters.category?.length) logFacetInteraction('category', filters.category.join(','))
    if (filters.supplier?.length)
      logFacetInteraction('supplier', filters.supplier.join(','))
    if (filters.packSizeRange)
      logFacetInteraction('packSizeRange', JSON.stringify(filters.packSizeRange))
  }, [filters.brand, filters.category, filters.supplier, filters.packSizeRange])

  useEffect(() => {
    logFacetInteraction('onlyWithPrice', onlyWithPrice)
  }, [onlyWithPrice])

  useEffect(() => {
    logFacetInteraction('mySuppliers', triSuppliers)
  }, [triSuppliers])

  useEffect(() => {
    logFacetInteraction('special', triSpecial)
  }, [triSpecial])

  useEffect(() => {
    logFacetInteraction('sort', sortOrder)
  }, [sortOrder])

  useEffect(() => {
    if (error) {
      console.error(error)
      AnalyticsTracker.track('catalog_error', {
        message: String(error),
        orgId: orgId || 'public',
      })
    }
  }, [error, orgId])

  useEffect(() => {
    if (
      (orgQuery.isFetched || publicQuery.isFetched) &&
      products.length === 0 &&
      debouncedSearch
    ) {
      logZeroResults(debouncedSearch, {
        ...filters,
        onlyWithPrice,
        triStock,
        mySuppliers: triSuppliers,
        sort: sortOrder,
      })
    }
  }, [
    orgQuery.isFetched,
    publicQuery.isFetched,
    products.length,
    debouncedSearch,
    filters,
    onlyWithPrice,
    triStock,
    triSuppliers,
    sortOrder,
  ])

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
  const hasFacetFilters = Boolean(
    (filters.brand && filters.brand.length) ||
      (filters.category && filters.category.length) ||
      (filters.supplier && filters.supplier.length) ||
      filters.packSizeRange,
  )
  const hasSearchQuery = Boolean((filters.search ?? '').trim().length)
  const hasAnyFilters =
    hasFacetFilters ||
    hasSearchQuery ||
    onlyWithPrice ||
    triStock !== 'off' ||
    triSuppliers !== 'off' ||
    triSpecial !== 'off'
  const showConnectBanner = hideConnectPill && !bannerDismissed && products.length > 0
  const sentinelKey = useMemo(
    () =>
      [
        viewKey,
        stringifiedFilters,
        sortOrder,
        triStock,
        triSuppliers,
        triSpecial,
        view,
      ].join(':'),
    [
      viewKey,
      stringifiedFilters,
      sortOrder,
      triStock,
      triSuppliers,
      triSpecial,
      view,
    ],
  )

  const handleSort = (
    key: 'name' | 'supplier' | 'price' | 'availability',
  ) => {
    setTableSort(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleAdd = (product: any, selectedSupplierId?: string) => {
    const supplierIds = Array.isArray(product.supplier_ids)
      ? (product.supplier_ids as unknown[]).filter(
          (value): value is string => typeof value === 'string' && value.length > 0,
        )
      : []
    const supplierNames = Array.isArray(product.supplier_names)
      ? (product.supplier_names as unknown[]).filter(
          (value): value is string => typeof value === 'string' && value.length > 0,
        )
      : []
    const supplierEntries = Array.isArray(product.suppliers)
      ? product.suppliers.filter(Boolean)
      : []

    const extractId = (entry: any): string => {
      if (!entry) return ''
      if (typeof entry === 'string') return entry
      return (
        entry.supplier_id ??
        entry.id ??
        entry.supplierId ??
        entry.supplier?.id ??
        ''
      )
    }

    const extractName = (entry: any): string => {
      if (!entry) return ''
      if (typeof entry === 'string') return entry
      return (
        entry.supplier_name ??
        entry.name ??
        entry.displayName ??
        entry.supplier?.name ??
        ''
      )
    }

    let supplierId =
      typeof selectedSupplierId === 'string' && selectedSupplierId.length > 0
        ? selectedSupplierId
        : undefined

    if (!supplierId && supplierIds.length) {
      supplierId = supplierIds[0]
    }

    if (!supplierId && supplierEntries.length) {
      supplierId = extractId(supplierEntries[0]) || undefined
    }

    if (!supplierId) {
      supplierId = ''
    }

    const findNameForId = (id: string): string => {
      if (!id) return ''
      const index = supplierIds.indexOf(id)
      if (index !== -1) {
        const candidate = supplierNames[index]
        if (candidate) return candidate
      }
      const supplierMatch = supplierEntries.find(entry => extractId(entry) === id)
      if (supplierMatch) {
        const candidate = extractName(supplierMatch)
        if (candidate) return candidate
      }
      return ''
    }

    let supplierName = findNameForId(supplierId)

    if (!supplierName && supplierNames.length) {
      supplierName = supplierNames[0]
    }

    if (!supplierName && supplierEntries.length) {
      supplierName = extractName(supplierEntries[0])
    }

    if (!supplierName && supplierId) {
      supplierName = supplierId
    }

    const item: Omit<CartItem, 'quantity'> = {
      id: product.catalog_id,
      supplierId,
      supplierName: supplierName || supplierId || '',
      itemName: product.name,
      sku: product.catalog_id,
      packSize: product.pack_size || '',
      packPrice: product.best_price ?? 0,
      unitPriceExVat: product.best_price ?? 0,
      unitPriceIncVat: product.best_price ?? 0,
      vatRate: 0,
      unit: '',
      supplierItemId: product.catalog_id,
      displayName: product.name,
      packQty: 1,
      image: resolveImage(
        product.sample_image_url,
        product.availability_status,
      ),
    }
    setAddingId(product.catalog_id)
    addItem(item, 1)
    setTimeout(() => setAddingId(null), 500)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const shouldBeScrolled = window.scrollY > 0
    setScrolled(prev => (prev === shouldBeScrolled ? prev : shouldBeScrolled))
  }, [view])

  const total = totalCount


  return (
    <AppLayout
      headerRef={headerRef}
      header={
        <FiltersBar
          filters={filters}
          setFilters={setFilters}
          onlyWithPrice={onlyWithPrice}
          setOnlyWithPrice={setOnlyWithPrice}
          triStock={triStock}
          setTriStock={setTriStock}
          triSpecial={triSpecial}
          setTriSpecial={setTriSpecial}
          triSuppliers={triSuppliers}
          setTriSuppliers={setTriSuppliers}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          view={view}
          setView={setView}
          error={error}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          focusedFacet={focusedFacet}
          setFocusedFacet={setFocusedFacet}
          total={total}
          scrolled={scrolled}
          filtersButtonRef={filtersButtonRef}
        />
      }
      secondary={
        showFilters ? (
          <CatalogFiltersPanel
            filters={filters}
            onChange={setFilters}
            focusedFacet={focusedFacet}
            onClearFilters={clearAllFilters}
            headingRef={filtersHeadingRef}
          />
        ) : null
      }
      panelOpen={showFilters}
    >
      <div
        className={cn(
          CATALOG_CONTAINER_CLASS,
          'w-full space-y-5 pb-8',
          view === 'grid' ? 'pt-2' : 'pt-2',
        )}
      >
        {showConnectBanner && (
          <div
            data-testid="alert"
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Connect suppliers to unlock prices.
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Get live pricing and availability by connecting with your suppliers.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                >
                  Browse suppliers
                </Button>
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
                  aria-label="Dismiss connect suppliers banner"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}

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
                showPrice
                addingId={addingId}
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {`${displayProducts.length} item${displayProducts.length === 1 ? '' : 's'} visible`}
                </p>
                <CatalogTable
                  products={displayProducts}
                  sort={tableSort}
                  onSort={handleSort}
                />
              </>
            )}

            {hasNextPage && (
              <div className="flex flex-col items-center gap-3 py-6">
                <InfiniteSentinel
                  key={sentinelKey}
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
    </AppLayout>
  )
}

interface FiltersBarProps {
  filters: FacetFilters
  setFilters: (f: Partial<FacetFilters>) => void
  onlyWithPrice: boolean
  setOnlyWithPrice: (v: boolean) => void
  triStock: TriState
  setTriStock: (v: TriState) => void
  triSpecial: TriState
  setTriSpecial: (v: TriState) => void
  triSuppliers: TriState
  setTriSuppliers: (v: TriState) => void
  sortOrder: SortOrder
  setSortOrder: (v: SortOrder) => void
  view: 'grid' | 'list'
  setView: (v: 'grid' | 'list') => void
  error: unknown
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  focusedFacet: keyof FacetFilters | null
  setFocusedFacet: (f: keyof FacetFilters | null) => void
  onLockChange?: (locked: boolean) => void
  total: number | null
  scrolled: boolean
  filtersButtonRef?: React.RefObject<HTMLButtonElement>
}

function FiltersBar({
  filters,
  setFilters,
  onlyWithPrice: _onlyWithPrice,
  setOnlyWithPrice,
  triStock,
  setTriStock,
  triSpecial,
  setTriSpecial,
  triSuppliers,
  setTriSuppliers,
  sortOrder,
  setSortOrder,
  view,
  setView,
  error,
  showFilters,
  setShowFilters,
  focusedFacet,
  setFocusedFacet,
  onLockChange,
  total,
  scrolled,
  filtersButtonRef,
}: FiltersBarProps) {
  const containerClass = CATALOG_CONTAINER_CLASS
  const { search: _search, ...facetFilters } = filters
  const chips = deriveChipsFromFilters(
    filters,
    setFilters,
    facet => {
      setFocusedFacet(facet)
      setShowFilters(true)
      onLockChange?.(true)
    },
  )
  const activeFacetCount = chips.length
  const activeCount =
    (triStock !== 'off' ? 1 : 0) +
    (triSuppliers !== 'off' ? 1 : 0) +
    (triSpecial !== 'off' ? 1 : 0) +
    activeFacetCount

  const clearAll = useCallback(() => {
    setTriStock('off')
    setTriSuppliers('off')
    setTriSpecial('off')
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
      availability: undefined,
    })
  }, [setTriStock, setTriSuppliers, setTriSpecial, setOnlyWithPrice, setFilters])

  const searchRef = useRef<HTMLInputElement>(null)
  const searchValue = filters.search ?? ''
  const showClear = searchValue.length > 0

  const formattedTotal = useMemo(() => {
    if (typeof total === 'number' && Number.isFinite(total)) {
      try {
        return new Intl.NumberFormat().format(total)
      } catch {
        return String(total)
      }
    }
    return null
  }, [total])

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

  const toggleFilters = useCallback(() => {
    const next = !showFilters
    if (next) {
      const first = Object.entries(facetFilters).find(([, v]) =>
        Array.isArray(v) ? v.length > 0 : Boolean(v),
      )?.[0] as keyof FacetFilters | undefined
      setFocusedFacet(first ?? null)
    } else {
      setFocusedFacet(null)
    }
    setShowFilters(next)
    onLockChange?.(next)
  }, [showFilters, facetFilters, setFocusedFacet, setShowFilters, onLockChange])

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
            ref={extraClassName ? undefined : filtersButtonRef}
            className={cn(
              'inline-flex h-[var(--ctrl-h,40px)] items-center gap-3 rounded-[var(--ctrl-r,12px)] bg-[color:var(--chip-bg)] px-3 text-sm font-semibold text-[color:var(--ink-hi)] ring-1 ring-inset ring-[color:var(--ring-idle)] backdrop-blur-xl transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--toolbar-bg)] hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] hover:ring-[color:var(--ring-hover)] motion-reduce:transition-none',
              showFilters && 'bg-[color:var(--seg-active-bg)] text-[color:var(--ink-hi)] ring-[color:var(--ring-hover)]',
              extraClassName,
            )}
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
    [toggleFilters, showFilters, activeCount],
  )

  const isEditableElement = (el: Element | null) => {
    if (!el) return false
    return (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement ||
      (el as HTMLElement).isContentEditable
    )
  }

  useEffect(() => {
    const handleShortcuts = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return

      const key = event.key.toLowerCase()
      const active = document.activeElement

      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        if (isEditableElement(active)) return
        event.preventDefault()
        onLockChange?.(true)
        searchRef.current?.focus()
        return
      }

      if (event.altKey || event.metaKey || event.ctrlKey) return
      if (isEditableElement(active)) return

      if (key === 'f') {
        event.preventDefault()
        toggleFilters()
        return
      }
      if (key === 'g') {
        event.preventDefault()
        if (view !== 'grid') setView('grid')
        return
      }
      if (key === 'l') {
        event.preventDefault()
        if (view !== 'list') setView('list')
      }
    }

    window.addEventListener('keydown', handleShortcuts)
    return () => window.removeEventListener('keydown', handleShortcuts)
  }, [toggleFilters, setView, view, onLockChange])

    return (
      <section
        style={COMPACT_TOOLBAR_TOKENS}
        className={cn(
          'relative bg-[color:var(--toolbar-bg)] backdrop-blur-xl ring-1 ring-inset ring-[color:var(--ring-idle)] after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/12 after:content-[""]',
          scrolled && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/16 before:opacity-70 before:content-[""]',
        )}
      >
        {error && (
          <div className={cn(containerClass, 'py-3')}>
            <Alert
              variant="destructive"
              className="rounded-[var(--ctrl-r,12px)] bg-white/12 text-[color:var(--ink)] ring-1 ring-inset ring-white/15 shadow-[0_16px_36px_rgba(3,10,22,0.45)] backdrop-blur-xl"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{String(error)}</AlertDescription>
            </Alert>
          </div>
        )}

        <div className={containerClass}>
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 sm:flex-1 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative min-w-0 flex-1">
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
                    onFocus={() => onLockChange?.(true)}
                    onBlur={() => onLockChange?.(false)}
                    className="h-11 w-full rounded-[var(--ctrl-r,14px)] bg-white pl-12 pr-12 text-base font-semibold text-slate-900 placeholder:text-slate-500 ring-1 ring-inset ring-[color:var(--ring-idle)] shadow-[0_12px_38px_rgba(7,18,30,0.26)] transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:ring-[color:var(--ring-hover)] motion-reduce:transition-none"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 transition duration-150 ease-out hover:bg-slate-200/70 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-0 motion-reduce:transition-none"
                >
                  <XCircle size={20} weight="fill" />
                </button>
              )}
              </div>
              {formattedTotal && (
                <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--ink-hi)] sm:flex-shrink-0 sm:justify-end">
                  <span className="tabular-nums">{formattedTotal} results</span>
                </div>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2.5">
              <SortDropdown
                value={sortOrder}
                onChange={setSortOrder}
                onOpenChange={onLockChange}
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

          <div className="flex flex-wrap items-center gap-2 pb-3">
            {renderFiltersToggleButton('shrink-0')}
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
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="shrink-0 whitespace-nowrap text-sm font-medium text-[color:var(--ink-dim)]/80 underline decoration-white/20 underline-offset-4 transition-colors hover:text-[color:var(--ink)]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </section>
    )
}
