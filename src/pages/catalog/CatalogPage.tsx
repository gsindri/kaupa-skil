import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Mic, X } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { useDebounce } from '@/hooks/useDebounce'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { ProductCard } from '@/components/catalog/ProductCard'
import { ProductCardSkeleton } from '@/components/catalog/ProductCardSkeleton'
import { HeroSearchInput } from '@/components/search/HeroSearchInput'
import { FilterChip } from '@/components/ui/filter-chip'
import { TriStateFilterChip } from '@/components/ui/tri-state-chip'
import { CatalogFiltersPanel } from '@/components/catalog/CatalogFiltersPanel'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { FacetFilters, PublicCatalogFilters, OrgCatalogFilters } from '@/services/catalog'
import {
  logFilter,
  logFacetInteraction,
  logSearch,
  logZeroResults,
} from '@/lib/analytics'
import { AnalyticsTracker } from '@/components/quick/AnalyticsTrackerUtils'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { LayoutDebugger } from '@/components/debug/LayoutDebugger'
import { FullWidthLayout } from '@/components/layout/FullWidthLayout'
import { useCatalogFilters, SortOrder, triStockToAvailability } from '@/state/catalogFilters'
import type { TriState } from '@/state/catalogFilters'
import { useCart } from '@/contexts/useBasket'
import type { CartItem } from '@/lib/types'
import { resolveImage } from '@/lib/images'
import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
            setFilters({ category: filters.category!.filter(c => c !== id) }),
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
            setFilters({ supplier: filters.supplier!.filter(s => s !== id) }),
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
            setFilters({ supplier: filters.supplier!.filter(s => s !== id) }),
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
          onRemove: () =>
            setFilters({ brand: filters.brand!.filter(b => b !== id) }),
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
      const stored = localStorage.getItem('catalog-view')
      if (stored === 'grid' || stored === 'list') return stored
    } catch {
      /* ignore */
    }
    return 'grid'
  })
  const [cursor, setCursor] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const lastCursor = useRef<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [bulkMode, setBulkMode] = useState(false)
  const { addItem } = useCart()
  const [addingId, setAddingId] = useState<string | null>(null)
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'supplier' | 'price' | 'availability'
    direction: 'asc' | 'desc'
  } | null>({ key: 'name', direction: 'asc' })
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [focusedFacet, setFocusedFacet] = useState<keyof FacetFilters | null>(null)
  const [cols, setCols] = useState(1)
  const stringifiedFilters = useMemo(() => JSON.stringify(filters), [filters])
  const [bannerDismissed, setBannerDismissed] = useState(false)

  // Smart header auto-hide refs and state
  const headerRef = useRef<HTMLDivElement>(null)
  const searchRowRef = useRef<HTMLDivElement>(null)
  const chipsRowRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  const headerHeight = useRef(0)
  const rafId = useRef<number>()
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [hasOpenDropdown, setHasOpenDropdown] = useState(false)

  // Smart header auto-hide implementation
  useEffect(() => {
    const header = headerRef.current
    const searchRow = searchRowRef.current
    const chipsRow = chipsRowRef.current
    if (!header || !searchRow || !chipsRow) return

    // Measure header height and set CSS custom property
    const updateHeaderHeight = () => {
      const h = Math.round(header.offsetHeight)
      headerHeight.current = h
      document.documentElement.style.setProperty('--header-h', `${h}px`)
    }
    updateHeaderHeight()

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Reset header and row transforms
    const resetHeader = () => {
      if (prefersReducedMotion) return
      header.classList.remove('is-hidden')
      searchRow.style.transform = ''
      chipsRow.style.transform = ''
    }

    // Apply progressive transforms during first screen
    const applyProgressiveTransforms = (scrollY: number) => {
      if (prefersReducedMotion) return
      
      const H = headerHeight.current
      if (H === 0) return

      const progress = Math.min(scrollY / H, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic

      // Slide rows out in thirds
      const third = H / 3
      const chipsProgress = Math.min(Math.max((scrollY - 0) / third, 0), 1)
      const searchProgress = Math.min(Math.max((scrollY - third) / third, 0), 1)
      
      chipsRow.style.transform = `translateY(-${chipsProgress * 100}%)`
      searchRow.style.transform = `translateY(-${searchProgress * 100}%)`
    }

    // Check if header should be pinned (always visible)
    const isPinned = () => {
      return isSearchFocused || hasOpenDropdown || window.scrollY < 1
    }

    let lastDirection = 0
    let snapThreshold = 10 // hysteresis threshold

    const handleScroll = () => {
      const scrollY = Math.max(0, window.scrollY)
      const deltaY = scrollY - lastScrollY.current
      lastScrollY.current = scrollY

      // Always show if pinned
      if (isPinned()) {
        resetHeader()
        applyProgressiveTransforms(0)
        return
      }

      const H = headerHeight.current
      if (H === 0) return

      // Progressive phase (first screenful)
      if (scrollY < H) {
        header.classList.remove('is-hidden')
        applyProgressiveTransforms(scrollY)
        return
      }

      // Snap phase (beyond first screenful)
      if (!prefersReducedMotion) {
        // Reset progressive transforms since we're in snap mode
        searchRow.style.transform = ''
        chipsRow.style.transform = ''

        // Apply hysteresis for snap behavior
        if (Math.abs(deltaY) > snapThreshold) {
          if (deltaY > 0 && lastDirection >= 0) {
            // Scrolling down - hide header
            header.classList.add('is-hidden')
            lastDirection = 1
          } else if (deltaY < 0 && lastDirection <= 0) {
            // Scrolling up - show header
            header.classList.remove('is-hidden')
            lastDirection = -1
          }
        }
      }
    }

    const scheduleUpdate = () => {
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        handleScroll()
        rafId.current = undefined
      })
    }

    // Set up scroll listener
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    
    // Set up resize observer for header height changes
    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    resizeObserver.observe(header)

    // Cleanup
    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      resizeObserver.disconnect()
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [isSearchFocused, hasOpenDropdown])

  useEffect(() => {
    try {
      localStorage.setItem('catalog-view', view)
    } catch {
      /* ignore */
    }
  }, [view])

  const unconnectedPercentage = useMemo(() => {
    if (!products.length) return 0
    const missing = products.filter(p => !p.suppliers?.length).length
    return (missing / products.length) * 100
  }, [products])
  const hideConnectPill = unconnectedPercentage > 70

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
    const updateCols = () => {
      if (!gridRef.current) return
      const width = gridRef.current.getBoundingClientRect().width
      let max = 4
      if (width >= 1800) max = 6
      const cols = Math.min(max, Math.floor(width / 320))
      setCols(cols)
    }

    if (view === 'grid') {
      const observer = new ResizeObserver(updateCols)
      const el = gridRef.current
      if (el) observer.observe(el)
      updateCols()
      return () => {
        if (el) observer.unobserve(el)
      }
    }
  }, [view])

  useEffect(() => {
    setProducts([])
    setCursor(null)
    setNextCursor(null)
    lastCursor.current = null
    window.scrollTo({ top: 0, behavior: 'instant' })
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
      cursor,
    }),
    [filters, debouncedSearch, onlyWithPrice, triSpecial, availability, cursor],
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
      cursor,
    }),
    [
      filters,
      debouncedSearch,
      onlyWithPrice,
      triSuppliers,
      triSpecial,
      availability,
      cursor,
    ],
  )

  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)

  const {
    data: publicData,
    nextCursor: publicNext,
    isFetching: publicFetching,
    error: publicError,
    total: publicTotal,
  } = publicQuery
  const {
    data: orgData,
    nextCursor: orgNext,
    isFetching: orgFetching,
    error: orgError,
    total: orgTotal,
  } = orgQuery

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
    if (publicError) {
      console.error(publicError)
      AnalyticsTracker.track('catalog_public_error', {
        message: String(publicError),
      })
    }
  }, [publicError])

  useEffect(() => {
    if (orgError) {
      console.error(orgError)
      AnalyticsTracker.track('catalog_org_error', {
        message: String(orgError),
      })
    }
  }, [orgError])

  useEffect(() => {
    const gotOrg = Array.isArray(orgData) && orgData.length > 0
    const data = gotOrg ? orgData : publicData
    const next = gotOrg ? orgNext : publicNext
    const fetching = gotOrg ? orgFetching : publicFetching
    if (fetching) return

    if (!data) return
    if (cursor && cursor === lastCursor.current) return

    // Merge newly fetched items while ensuring unique catalog entries
    setProducts(prev => {
      const merged = cursor ? [...prev, ...data] : data
      const seen = new Set<string>()
      return merged.filter(item => {
        if (seen.has(item.catalog_id)) return false
        seen.add(item.catalog_id)
        return true
      })
    })
    setNextCursor(next ?? null)
    lastCursor.current = cursor
  }, [
    orgData,
    publicData,
    orgNext,
    publicNext,
    orgFetching,
    publicFetching,
    cursor,
    // ensure products update when filter flags change
    debouncedSearch,
    onlyWithPrice,
    triStock,
    triSuppliers,
    triSpecial,
    sortOrder,
    stringifiedFilters,
    orgId,
  ])

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

  const gotOrg = Array.isArray(orgData) && orgData.length > 0
  const gotPublic = Array.isArray(publicData) && publicData.length > 0

  const isLoading = gotOrg ? orgQuery.isFetching : publicQuery.isFetching
  const loadingMore = isLoading && cursor !== null

  const loadMore = useCallback(() => {
    if (nextCursor && nextCursor !== cursor && !loadingMore) setCursor(nextCursor)
  }, [nextCursor, cursor, loadingMore])

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
          av = (a.suppliers?.[0] || '').toLowerCase()
          bv = (b.suppliers?.[0] || '').toLowerCase()
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

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !nextCursor) return
    const observer = new IntersectionObserver(entries => {
      const [entry] = entries
      if (entry.isIntersecting) {
        loadMore()
      }
    })
    observer.observe(sentinel)
    return () => {
      observer.disconnect()
    }
  }, [nextCursor, loadMore])

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(sortedProducts.map(p => p.catalog_id))
    } else {
      setSelected([])
    }
  }

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

  const handleFilterChange = (f: Partial<FacetFilters>) => {
    setFilters(f)
  }

  const handleAdd = (product: any) => {
    const item: Omit<CartItem, 'quantity'> = {
      id: product.catalog_id,
      supplierId: product.suppliers?.[0] || '',
      supplierName: product.suppliers?.[0] || '',
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


  const total =
    gotOrg && typeof orgTotal === 'number'
      ? orgTotal
      : gotPublic && typeof publicTotal === 'number'
        ? publicTotal
        : null

  return (
    <FullWidthLayout
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
          publicError={publicError}
          orgError={orgError}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          focusedFacet={focusedFacet}
          setFocusedFacet={setFocusedFacet}
          onSearchFocus={setIsSearchFocused}
          onDropdownOpen={setHasOpenDropdown}
          searchRowRef={searchRowRef}
          chipsRowRef={chipsRowRef}
        />
      }
      headerRef={headerRef}
    >
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && <LayoutDebugger show />}

      <div style={{ paddingTop: 'var(--header-h, 0px)' }} className="px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        {view === 'list' ? (
          <>
              {hideConnectPill && !bannerDismissed && (
                <Alert className="mb-4">
                  <AlertDescription className="flex items-center justify-between">
                    Connect suppliers to unlock prices.
                    <button
                      type="button"
                      aria-label="Dismiss"
                      onClick={() => setBannerDismissed(true)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </AlertDescription>
                </Alert>
              )}
              {bulkMode && (
                <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background px-4 py-2 text-sm">
                  <span>{selected.length} selected</span>
                  <Button variant="ghost" onClick={() => { setBulkMode(false); setSelected([]) }}>
                    Done
                  </Button>
                </div>
              )}
              <CatalogTable
                products={sortedProducts}
                selected={selected}
                onSelect={toggleSelect}
                onSelectAll={handleSelectAll}
                sort={tableSort}
                onSort={handleSort}
                filters={filters}
                onFilterChange={handleFilterChange}
                isBulkMode={bulkMode}
              />
          </>
        ) : (
          <div
            ref={gridRef}
            className="grid justify-center justify-items-center gap-6"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(260px,1fr))` }}
          >
            {sortedProducts.map(product => (
              <ProductCard
                key={product.catalog_id}
                product={product}
                showPrice
                onAdd={() => handleAdd(product)}
                isAdding={addingId === product.catalog_id}
              />
            ))}
            {loadingMore &&
              Array.from({ length: 3 }).map((_, i) => (
                <ProductCardSkeleton key={`skeleton-${i}`} />
              ))}
          </div>
        )}
      </div>
      <div ref={sentinelRef} />
    </FullWidthLayout>
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
  publicError: unknown
  orgError: unknown
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  focusedFacet: keyof FacetFilters | null
  setFocusedFacet: (f: keyof FacetFilters | null) => void
  onSearchFocus: (focused: boolean) => void
  onDropdownOpen: (open: boolean) => void
  searchRowRef: React.RefObject<HTMLDivElement>
  chipsRowRef: React.RefObject<HTMLDivElement>
}

function FiltersBar({
  filters,
  setFilters,
  onlyWithPrice,
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
  publicError,
  orgError,
  showFilters,
  setShowFilters,
  focusedFacet,
  setFocusedFacet,
  onSearchFocus,
  onDropdownOpen,
  searchRowRef,
  chipsRowRef,
}: FiltersBarProps) {
  const { search: _search, ...facetFilters } = filters
  const chips = deriveChipsFromFilters(
    filters,
    setFilters,
    facet => {
      setFocusedFacet(facet)
      setShowFilters(true)
    },
  )
  const activeFacetCount = chips.length
  const activeCount =
    (triStock !== 'off' ? 1 : 0) +
    (triSuppliers !== 'off' ? 1 : 0) +
    (triSpecial !== 'off' ? 1 : 0) +
    activeFacetCount
  const clearAll = () => {
    setTriStock('off')
    setTriSuppliers('off')
    setTriSpecial('off')
    setOnlyWithPrice(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
    })
  }

  return (
    <Sheet
      open={showFilters}
      onOpenChange={open => {
        setShowFilters(open)
        onDropdownOpen(open)
        if (!open) setFocusedFacet(null)
      }}
    >
      <div className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="py-3 space-y-3">
          {(publicError || orgError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {String(publicError || orgError)}
              </AlertDescription>
            </Alert>
          )}
          <div ref={searchRowRef} className="header-row search-row">
            <div className="px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3">
              <div className="grid grid-cols-[1fr,auto,auto] gap-3 items-center">
              <HeroSearchInput
                placeholder="Search products"
                value={filters.search ?? ''}
                onChange={e => setFilters({ search: e.target.value })}
                onFocus={() => onSearchFocus(true)}
                onBlur={() => onSearchFocus(false)}
                rightSlot={
                  <button
                    type="button"
                    aria-label="Voice search"
                    onClick={() => console.log('voice search')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Mic className="h-5 w-5" />
                  </button>
                }
              />
              <SortDropdown value={sortOrder} onChange={setSortOrder} onOpenChange={onDropdownOpen} />
              <ViewToggle value={view} onChange={setView} />
              </div>
            </div>
          </div>
          <div ref={chipsRowRef} className="header-row chips-row">
            <div className="px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-2">
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            {/* Disable pricing filter until pricing data is available */}
            {/* <FilterChip selected={onlyWithPrice} onSelectedChange={setOnlyWithPrice}>
               Only with price
             </FilterChip> */}
            <TriStateFilterChip
              state={triStock}
              onStateChange={setTriStock}
              includeLabel="In stock"
              excludeLabel="Out of stock"
              offLabel="All stock"
              includeAriaLabel="Filter: only in stock"
              excludeAriaLabel="Filter: out of stock"
              includeClassName="bg-green-500 text-white border-green-500"
              excludeClassName="bg-red-500 text-white border-red-500"
            />
            <TriStateFilterChip
              state={triSuppliers}
              onStateChange={setTriSuppliers}
              includeLabel="My suppliers"
              excludeLabel="Not my suppliers"
              offLabel="All suppliers"
              includeAriaLabel="Filter: my suppliers only"
              excludeAriaLabel="Filter: not my suppliers"
            />
            <TriStateFilterChip
              state={triSpecial}
              onStateChange={setTriSpecial}
              includeLabel="On special"
              excludeLabel="Not on special"
              offLabel="All specials"
              includeAriaLabel="Filter: on special only"
              excludeAriaLabel="Filter: not on special"
            />
            {chips.map(chip => (
              <div
                key={chip.key}
                className="flex items-center rounded-full border border-primary bg-primary px-3 py-1 text-sm text-primary-foreground"
              >
                <button
                  type="button"
                  onClick={chip.onEdit}
                  aria-description={`Edit filter: ${chip.key}`}
                  className="flex items-center"
                >
                  {chip.label}
                </button>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter: ${chip.label}`}
                  className="ml-1 text-primary-foreground/70 hover:text-primary-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <SheetTrigger asChild>
              <FilterChip
                selected={showFilters}
                aria-controls="catalog-filters-sheet"
                onClick={() => {
                  if (!showFilters) {
                    const first = Object.entries(facetFilters).find(([, v]) =>
                      Array.isArray(v) ? v.length > 0 : Boolean(v),
                    )?.[0] as keyof FacetFilters | undefined
                    setFocusedFacet(first ?? null)
                  }
                }}
              >
                {activeFacetCount ? `Filters (${activeFacetCount})` : 'More filters'}
              </FilterChip>
            </SheetTrigger>
            {activeCount > 0 && (
              <button
                type="button"
                className="text-sm underline whitespace-nowrap"
                onClick={clearAll}
              >
                Clear all
              </button>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <SheetContent
        side="right"
        className="w-3/4 sm:max-w-sm"
        id="catalog-filters-sheet"
      >
        <CatalogFiltersPanel
          filters={filters}
          onChange={setFilters}
          focusedFacet={focusedFacet}
        />
      </SheetContent>
    </Sheet>
  )
}
