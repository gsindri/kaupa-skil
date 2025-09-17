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
import { TriStateChip } from '@/components/ui/tri-state-chip'
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
import { LayoutDebugger } from '@/components/debug/LayoutDebugger'
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
      const stored = localStorage.getItem('catalog-view')
      if (stored === 'grid' || stored === 'list') return stored
    } catch {
      /* ignore */
    }
    return 'grid'
  })
  const viewKey = `catalog:${view}`
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
  const [showFilters, setShowFilters] = useState(true)
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
  const [headerLocked, setHeaderLocked] = useState(false)
  const lockCount = useRef(0)
  const [scrolled, setScrolled] = useState(false)
  const viewSwapQuietUntil = useRef(0)

  useEffect(() => {
    try {
      localStorage.setItem('catalog-view', view)
    } catch {
      /* ignore */
    }
  }, [view])

  useEffect(() => {
    restoreScroll(viewKey)
  }, [viewKey])

  useEffect(() => {
    viewSwapQuietUntil.current = performance.now() + 250
  }, [view])

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    el.style.setProperty('--hdr-p', '0')
    document.documentElement.style.setProperty('--hdr-p', '0')

    requestAnimationFrame(() => {
      const H = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${H}px`)
    })

    return () => {
      document.documentElement.style.setProperty('--hdr-p', '0')
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

  const handleLockChange = (locked: boolean) => {
    lockCount.current += locked ? 1 : -1
    setHeaderLocked(lockCount.current > 0)
  }

  useEffect(() => {
    // Respect reduced motion
    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const el = headerRef.current
    if (!el) return

    // Single source of truth for header height.
    let H = Math.round(el.getBoundingClientRect().height)
    const setHeaderVars = () => {
      H = Math.round(el.getBoundingClientRect().height)
      document.documentElement.style.setProperty('--header-h', `${H}px`)
    }
    setHeaderVars()
    const ro = new ResizeObserver(setHeaderVars)
    ro.observe(el)
    window.addEventListener('resize', setHeaderVars)

    const isTypeable = (el: Element | null) =>
      !!el &&
      ((el instanceof HTMLInputElement) ||
        (el instanceof HTMLTextAreaElement) ||
        (el as HTMLElement).isContentEditable ||
        el.getAttribute('role') === 'combobox')

    let interactionLockUntil = 0
    const lockFor = (ms: number) => {
      interactionLockUntil = performance.now() + ms
    }
    const handlePointerDown = () => lockFor(180)
    el.addEventListener('pointerdown', handlePointerDown, { passive: true })

    // Tunables
    const PROGRESS_START = 10      // px before progressive begins
    const GAP             = 24      // latch hysteresis around H
    const MIN_DY          = 0.25    // ignore micro-noise
    const SNAP_THRESHOLD  = 3       // accumulated px to flip in snap mode
    const SNAP_COOLDOWN_MS = 200    // minimum time between opposite snaps
    const REVEAL_DIST     = 32      // px upward after hide before show allowed
    const REHIDE_DIST     = 32      // px downward after show before hide allowed

    let lastY  = window.scrollY
    let acc    = 0                  // accumulator for snap sensitivity
    let lastDir: -1|0|1 = 0
    let lock: 'none'|'visible'|'hidden' = 'none'
    let prevP = -1                  // last applied p (avoid redundant style writes)
    let lastSnapDir: -1 | 0 | 1 = 0 // -1 visible, 1 hidden
    let lastSnapTime = 0
    let lastSnapY = 0

    const setP = (p: number) => {
      // snap near extremes to avoid micro "reload"
      const v = p < 0.02 ? 0 : p > 0.98 ? 1 : p
      if (v !== prevP) {
        const val = v.toFixed(3)
        el.style.setProperty('--hdr-p', val)
        document.documentElement.style.setProperty('--hdr-p', val)
        prevP = v
      }
    }

    const isPinned = () => {
      const now = performance.now()
      const ae = document.activeElement
      const menuOpen = el.querySelector('[data-open="true"]')
      return (
        window.scrollY < 1 ||
        headerLocked ||
        isTypeable(ae) ||
        !!menuOpen ||
        now < interactionLockUntil
      )
    }

    const onScroll = () => {
      const y  = Math.max(0, window.scrollY)
      const dy = y - lastY
      lastY = y
      setScrolled(y > 0)

      if (reduceMotion) { setP(0); return }

      if (isPinned()) {
        lock = 'none'; acc = 0; lastDir = 0; setP(0)
        return
      }

      // Release latches only when safely past the boundary.
      if (lock === 'visible' && y <= H - GAP) lock = 'none'
      if (lock === 'hidden'  && y >= H + GAP) lock = 'none'

      // Progressive zone with soft start and direction gating.
      if (y < H) {
        const dir: -1|0|1 = Math.abs(dy) < MIN_DY ? 0 : (dy > 0 ? 1 : -1)

        // If we're scrolling up (or holding still), keep header fully visible.
        if (lock === 'visible' || dir <= 0) {
          acc = 0; lastDir = dir; setP(0)
          return
        }

        // Only when moving down do we start progressive fade.
        const span = Math.max(1, H - PROGRESS_START)
        const t = Math.max(0, y - PROGRESS_START) / span // 0..1
        const p = 1 - Math.pow(1 - t, 3) // easeOutCubic
        acc = 0; lastDir = dir; setP(p)
        return
      }

      // Snap zone (y >= H): sensitive but stable using cooldown + distance hysteresis.
      if (lock === 'hidden') { setP(1); return }

      const dir: -1|0|1 = Math.abs(dy) < MIN_DY ? 0 : (dy > 0 ? 1 : -1)
      if (dir !== 0) {
        if (dir !== lastDir) acc = 0
        acc += dy
        lastDir = dir

        const now = performance.now()

        // Try to hide (downward snap)
        if (acc >= SNAP_THRESHOLD) {
          if (
            lastSnapDir === -1 &&
            (now - lastSnapTime < SNAP_COOLDOWN_MS || (y - lastSnapY) < REHIDE_DIST)
          ) {
            // hold visible
          } else {
            setP(1)
            lock = 'hidden'
            acc = 0
            lastSnapDir = 1
            lastSnapTime = now
            lastSnapY = y
            return
          }
        }

        // Try to show (upward snap)
        if (acc <= -SNAP_THRESHOLD) {
          if (
            lastSnapDir === 1 &&
            (now - lastSnapTime < SNAP_COOLDOWN_MS || (lastSnapY - y) < REVEAL_DIST)
          ) {
            // keep hidden
          } else {
            setP(0)
            lock = 'visible'
            acc = 0
            lastSnapDir = -1
            lastSnapTime = now
            lastSnapY = y
            return
          }
        }
      }
    }

    const listener = () => requestAnimationFrame(onScroll)
    window.addEventListener('scroll', listener, { passive: true })
    // If you keep wheel/touch preempts, guard them so they don't fight the rAF:
    const wheel = (e: WheelEvent) => {
      if (performance.now() < viewSwapQuietUntil.current) return
      if (window.scrollY >= H + GAP) {
        const now = performance.now()
        if (e.deltaY > 0) {
          // down → hide
          if (!(lastSnapDir === -1 && (now - lastSnapTime < SNAP_COOLDOWN_MS))) {
            setP(1)
            lock = 'hidden'
            lastSnapDir = 1
            lastSnapTime = now
            lastSnapY = window.scrollY
          }
        } else if (e.deltaY < 0) {
          // up → show
          if (!(lastSnapDir === 1 && (now - lastSnapTime < SNAP_COOLDOWN_MS))) {
            setP(0)
            lock = 'visible'
            lastSnapDir = -1
            lastSnapTime = now
            lastSnapY = window.scrollY
          }
        }
      }
    }
    window.addEventListener('wheel', wheel, { passive: true })

    // Initial apply
    listener()

    return () => {
      document.documentElement.style.setProperty('--hdr-p', '0')
      window.removeEventListener('scroll', listener)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('resize', setHeaderVars)
      el.removeEventListener('pointerdown', handlePointerDown)
      ro.disconnect()
    }
  }, [headerLocked, view])

  useEffect(() => {
    if (headerLocked) {
      headerRef.current?.style.setProperty('--hdr-p', '0')
      document.documentElement.style.setProperty('--hdr-p', '0')
    }
  }, [headerLocked])

  const total =
    gotOrg && typeof orgTotal === 'number'
      ? orgTotal
      : gotPublic && typeof publicTotal === 'number'
        ? publicTotal
        : null

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
          publicError={publicError}
          orgError={orgError}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          focusedFacet={focusedFacet}
          setFocusedFacet={setFocusedFacet}
          onLockChange={handleLockChange}
          total={total}
          scrolled={scrolled}
        />
      }
      secondary={
        showFilters ? (
          <div id="catalog-filters-panel">
            <CatalogFiltersPanel
              filters={filters}
              onChange={setFilters}
              focusedFacet={focusedFacet}
              onClearFilters={clearAllFilters}
            />
          </div>
        ) : null
      }
      panelOpen={showFilters}
    >
      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && <LayoutDebugger show />}

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
            <InfiniteSentinel
              onVisible={loadMore}
              disabled={!nextCursor || loadingMore}
              root={null}
              rootMargin="800px"
            />
            {loadingMore && (
              <div className="py-6 text-center text-muted-foreground">Loading more…</div>
            )}
        </>
      ) : (
        <CatalogGrid
          products={sortedProducts}
          onAddToCart={handleAdd}
          onNearEnd={nextCursor ? loadMore : undefined}
          showPrice
        />
      )}
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
  publicError: unknown
  orgError: unknown
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  focusedFacet: keyof FacetFilters | null
  setFocusedFacet: (f: keyof FacetFilters | null) => void
  onLockChange: (locked: boolean) => void
  total: number | null
  scrolled: boolean
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
  publicError,
  orgError,
  showFilters,
  setShowFilters,
  focusedFacet,
  setFocusedFacet,
  onLockChange,
  total,
  scrolled,
}: FiltersBarProps) {
  const { search: _search, ...facetFilters } = filters
  const chips = deriveChipsFromFilters(
    filters,
    setFilters,
    facet => {
      setFocusedFacet(facet)
      setShowFilters(true)
      onLockChange(true)
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
    onLockChange(next)
  }, [showFilters, facetFilters, setFocusedFacet, setShowFilters, onLockChange])

  const containerClass = cn(
    'mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8',
    showFilters && 'lg:max-w-[1600px]',
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
        onLockChange(true)
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
      className={cn(
        'relative border-b border-white/5 bg-[var(--toolbar-bg)] backdrop-blur-xl shadow-[var(--toolbar-shadow)] ring-1 ring-inset ring-white/10',
        scrolled && 'before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/10 before:content-[""]',
      )}
    >
      {(publicError || orgError) && (
        <div className={cn(containerClass, 'py-3')}>
          <Alert variant="destructive" className="border-white/20 bg-white/10 text-[color:var(--ink)]">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{String(publicError || orgError)}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className={containerClass}>
        <div className="flex h-[var(--toolbar-h,56px)] flex-wrap items-center gap-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
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
                    onFocus={() => onLockChange(true)}
                    onBlur={() => onLockChange(false)}
                    className="h-[var(--ctrl-h,40px)] w-full rounded-[var(--ctrl-r,12px)] bg-white/5 pl-10 pr-12 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink)]/65 ring-1 ring-inset ring-white/10 transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--toolbar-bg)] hover:-translate-y-[0.5px] hover:bg-white/10 hover:ring-white/20 motion-reduce:transform-none motion-reduce:transition-none"
                  />
                </TooltipTrigger>
                <TooltipContent sideOffset={8}>Search (Ctrl/⌘+K)</TooltipContent>
              </Tooltip>
              <span className="pointer-events-none absolute left-3 top-1/2 grid -translate-y-1/2 place-items-center text-[color:var(--ink-dim)]/80">
                <MagnifyingGlass size={18} weight="duotone" aria-hidden="true" />
              </span>
              {showClear && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[color:var(--ink-dim)]/80 transition duration-150 ease-out hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transition-none"
                >
                  <XCircle size={18} weight="duotone" />
                </button>
              )}
            </div>
            {formattedTotal && (
              <span className="hidden flex-none items-center text-xs font-medium leading-none text-[color:var(--ink-dim)]/75 tabular-nums sm:inline-flex sm:gap-2 sm:-translate-y-px">
                {formattedTotal}
                <span className="text-[color:var(--ink-dim)]/70">results</span>
              </span>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
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
                    'inline-flex h-[var(--ctrl-h,40px)] items-center gap-2 rounded-[var(--ctrl-r,12px)] bg-white/5 px-3 text-sm font-medium text-[color:var(--ink-dim)]/80 ring-1 ring-inset ring-white/10 transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--toolbar-bg)] hover:-translate-y-[0.5px] hover:bg-white/12 hover:text-[color:var(--ink)] hover:ring-white/20 motion-reduce:transform-none motion-reduce:transition-none',
                    showFilters && 'bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] ring-white/20',
                  )}
                >
                  <FunnelSimple size={18} weight={showFilters ? 'fill' : 'duotone'} />
                  <span className="hidden sm:inline">
                    {activeCount ? `Filters (${activeCount})` : 'Filters'}
                  </span>
                  <span className="sm:hidden">Filters</span>
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>Filters (F)</TooltipContent>
            </Tooltip>

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

        <div className="py-3">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
            <TriStateChip
              state={triStock}
              onStateChange={setTriStock}
              includeLabel="In stock"
              excludeLabel="Out of stock"
              offLabel="All stock"
              includeAriaLabel="Filter: only in stock"
              excludeAriaLabel="Filter: out of stock"
              includeClassName="bg-emerald-400/30 text-emerald-50 border-emerald-300/60 hover:bg-emerald-400/40"
              excludeClassName="bg-rose-400/30 text-rose-50 border-rose-300/60 hover:bg-rose-400/40"
              className="shrink-0"
            />
            <TriStateChip
              state={triSuppliers}
              onStateChange={setTriSuppliers}
              includeLabel="My suppliers"
              excludeLabel="Not my suppliers"
              offLabel="All suppliers"
              includeAriaLabel="Filter: my suppliers only"
              excludeAriaLabel="Filter: not my suppliers"
              includeClassName="bg-sky-400/30 text-sky-50 border-sky-300/60 hover:bg-sky-400/40"
              excludeClassName="bg-indigo-400/30 text-indigo-50 border-indigo-300/60 hover:bg-indigo-400/40"
              className="shrink-0"
            />
            <TriStateChip
              state={triSpecial}
              onStateChange={setTriSpecial}
              includeLabel="On special"
              excludeLabel="Not on special"
              offLabel="All specials"
              includeAriaLabel="Filter: on special only"
              excludeAriaLabel="Filter: not on special"
              includeClassName="bg-amber-400/30 text-amber-50 border-amber-300/60 hover:bg-amber-400/40"
              excludeClassName="bg-slate-500/30 text-slate-100 border-slate-400/60 hover:bg-slate-500/40"
              className="shrink-0"
            />
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
                className="shrink-0 whitespace-nowrap text-sm font-medium text-[color:var(--ink-dim)] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[color:var(--ink)]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
