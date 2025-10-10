import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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

import AppLayout from '@/components/layout/AppLayout'
import { useCatalogFilters, SortOrder } from '@/state/catalogFiltersStore'
import { useSearchParams } from 'react-router-dom'
import { MagnifyingGlass, FunnelSimple, XCircle } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { announceToScreenReader } from '@/components/quick/AccessibilityEnhancementsUtils'

const FILTER_PANEL_LS_KEY = 'catalog-filters-open'

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

  const totalCategories = (filters.category?.include?.length || 0) + (filters.category?.exclude?.length || 0)
  if (totalCategories > 0) {
    if (totalCategories <= 2) {
      filters.category?.include?.forEach(id => {
        chips.push({
          key: `category-include-${id}`,
          label: id,
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
      chips.push({
        key: 'category',
        label: `Categories (${totalCategories})`,
        onRemove: () => setFilters({ category: undefined }),
        onEdit: () => openFacet('category'),
      })
    }
  }

  const totalSuppliers = (filters.supplier?.include?.length || 0) + (filters.supplier?.exclude?.length || 0)
  if (totalSuppliers > 0) {
    if (totalSuppliers <= 2) {
      filters.supplier?.include?.forEach(id => {
        chips.push({
          key: `supplier-include-${id}`,
          label: id,
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
      chips.push({
        key: 'supplier',
        label: `Suppliers (${totalSuppliers})`,
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
      chips.push({
        key: 'brand',
        label: `Brands (${totalBrands})`,
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

  // Price Range Filters
  if (filters.priceRange) {
    const { min, max } = filters.priceRange
    let label = 'Price: '
    if (min != null && max != null) label += `${min}-${max} kr`
    else if (min != null) label += `≥ ${min} kr`
    else if (max != null) label += `≤ ${max} kr`
    chips.push({
      key: 'priceRange',
      label,
      onRemove: () => setFilters({ priceRange: undefined }),
      onEdit: () => openFacet('priceRange'),
    })
  }

  if (filters.pricePerUnitRange) {
    const { min, max } = filters.pricePerUnitRange
    let label = 'Price/Unit: '
    if (min != null && max != null) label += `${min}-${max} kr`
    else if (min != null) label += `≥ ${min} kr`
    else if (max != null) label += `≤ ${max} kr`
    chips.push({
      key: 'pricePerUnitRange',
      label,
      onRemove: () => setFilters({ pricePerUnitRange: undefined }),
      onEdit: () => openFacet('pricePerUnitRange'),
    })
  }

  // Dietary Filters
  const dietaryLabels: Record<string, string> = {
    vegan: 'Vegan',
    vegetarian: 'Vegetarian',
    gluten_free: 'Gluten-Free',
    halal: 'Halal',
  }
  const dietaryItems = filters.dietary || []
  if (dietaryItems.length > 0) {
    if (dietaryItems.length <= 2) {
      dietaryItems.forEach(item => {
        chips.push({
          key: `dietary-${item}`,
          label: dietaryLabels[item] || item,
          onRemove: () => {
            const updated = dietaryItems.filter(d => d !== item)
            setFilters({ dietary: updated.length > 0 ? updated : undefined })
          },
          onEdit: () => openFacet('dietary'),
        })
      })
    } else {
      chips.push({
        key: 'dietary',
        label: `Dietary (${dietaryItems.length})`,
        onRemove: () => setFilters({ dietary: undefined }),
        onEdit: () => openFacet('dietary'),
      })
    }
  }

  // Quality Filters
  const qualityLabels: Record<string, string> = {
    organic: 'Organic',
    fair_trade: 'Fair Trade',
    eco_friendly: 'Eco-Friendly',
    icelandic: 'Icelandic',
  }
  const qualityItems = filters.quality || []
  if (qualityItems.length > 0) {
    if (qualityItems.length <= 2) {
      qualityItems.forEach(item => {
        chips.push({
          key: `quality-${item}`,
          label: qualityLabels[item] || item,
          onRemove: () => {
            const updated = qualityItems.filter(q => q !== item)
            setFilters({ quality: updated.length > 0 ? updated : undefined })
          },
          onEdit: () => openFacet('quality'),
        })
      })
    } else {
      chips.push({
        key: 'quality',
        label: `Quality (${qualityItems.length})`,
        onRemove: () => setFilters({ quality: undefined }),
        onEdit: () => openFacet('quality'),
      })
    }
  }

  // Operational Filters
  if (filters.operational) {
    const { moq, leadTimeDays, caseBreak, directDelivery, sameDay } = filters.operational
    if (moq != null) {
      chips.push({
        key: 'operational-moq',
        label: `MOQ ≤ ${moq}`,
        onRemove: () => {
          const updated = { ...filters.operational }
          delete updated.moq
          const hasOtherProps = Object.keys(updated).some(k => updated[k as keyof typeof updated] != null)
          setFilters({ operational: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('operational'),
      })
    }
    if (leadTimeDays != null) {
      chips.push({
        key: 'operational-leadTime',
        label: `Lead Time ≤ ${leadTimeDays}d`,
        onRemove: () => {
          const updated = { ...filters.operational }
          delete updated.leadTimeDays
          const hasOtherProps = Object.keys(updated).some(k => updated[k as keyof typeof updated] != null)
          setFilters({ operational: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('operational'),
      })
    }
    if (caseBreak) {
      chips.push({
        key: 'operational-caseBreak',
        label: 'Case Break',
        onRemove: () => {
          const updated = { ...filters.operational, caseBreak: false }
          const hasOtherProps = updated.moq != null || updated.leadTimeDays != null || updated.directDelivery || updated.sameDay
          setFilters({ operational: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('operational'),
      })
    }
    if (directDelivery) {
      chips.push({
        key: 'operational-directDelivery',
        label: 'Direct Delivery',
        onRemove: () => {
          const updated = { ...filters.operational, directDelivery: false }
          const hasOtherProps = updated.moq != null || updated.leadTimeDays != null || updated.caseBreak || updated.sameDay
          setFilters({ operational: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('operational'),
      })
    }
    if (sameDay) {
      chips.push({
        key: 'operational-sameDay',
        label: 'Same Day',
        onRemove: () => {
          const updated = { ...filters.operational, sameDay: false }
          const hasOtherProps = updated.moq != null || updated.leadTimeDays != null || updated.caseBreak || updated.directDelivery
          setFilters({ operational: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('operational'),
      })
    }
  }

  // Lifecycle Filters
  const lifecycleLabels: Record<string, string> = {
    new: 'New',
    discontinued: 'Discontinued',
    seasonal: 'Seasonal',
  }
  const lifecycleItems = filters.lifecycle || []
  if (lifecycleItems.length > 0) {
    lifecycleItems.forEach(item => {
      chips.push({
        key: `lifecycle-${item}`,
        label: lifecycleLabels[item] || item,
        onRemove: () => {
          const updated = lifecycleItems.filter(l => l !== item)
          setFilters({ lifecycle: updated.length > 0 ? updated : undefined })
        },
        onEdit: () => openFacet('lifecycle'),
      })
    })
  }

  // Data Quality Filters
  if (filters.dataQuality) {
    const { hasImage, hasPrice, hasDescription } = filters.dataQuality
    if (hasImage) {
      chips.push({
        key: 'dataQuality-hasImage',
        label: 'Has Image',
        onRemove: () => {
          const updated = { ...filters.dataQuality, hasImage: false }
          const hasOtherProps = updated.hasPrice || updated.hasDescription
          setFilters({ dataQuality: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('dataQuality'),
      })
    }
    if (hasPrice) {
      chips.push({
        key: 'dataQuality-hasPrice',
        label: 'Has Price',
        onRemove: () => {
          const updated = { ...filters.dataQuality, hasPrice: false }
          const hasOtherProps = updated.hasImage || updated.hasDescription
          setFilters({ dataQuality: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('dataQuality'),
      })
    }
    if (hasDescription) {
      chips.push({
        key: 'dataQuality-hasDescription',
        label: 'Has Description',
        onRemove: () => {
          const updated = { ...filters.dataQuality, hasDescription: false }
          const hasOtherProps = updated.hasImage || updated.hasPrice
          setFilters({ dataQuality: hasOtherProps ? updated : undefined })
        },
        onEdit: () => openFacet('dataQuality'),
      })
    }
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
  // Removed separate products state - using data directly from hooks
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
    const param = searchParams.get('in_stock')
    if (param === 'true') {
      setInStock(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Read initial facet filters and toggles from URL on mount
  useEffect(() => {
    const f: Partial<FacetFilters> = {}
    const categories = searchParams.get('categories')
    const categoriesExclude = searchParams.get('categories_exclude')
    const brands = searchParams.get('brands')
    const brandsExclude = searchParams.get('brands_exclude')
    const suppliers = searchParams.get('suppliers')
    const suppliersExclude = searchParams.get('suppliers_exclude')
    const pack = searchParams.get('pack')
    const search = searchParams.get('search')
    
    if (categories || categoriesExclude) {
      f.category = {
        include: categories ? categories.split(',').filter(Boolean) : [],
        exclude: categoriesExclude ? categoriesExclude.split(',').filter(Boolean) : []
      }
    }
    if (brands || brandsExclude) {
      f.brand = {
        include: brands ? brands.split(',').filter(Boolean) : [],
        exclude: brandsExclude ? brandsExclude.split(',').filter(Boolean) : []
      }
    }
    if (suppliers || suppliersExclude) {
      f.supplier = {
        include: suppliers ? suppliers.split(',').filter(Boolean) : [],
        exclude: suppliersExclude ? suppliersExclude.split(',').filter(Boolean) : []
      }
    }
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
    const suppliersParam = searchParams.get('my_suppliers')
    const specialParam = searchParams.get('special_only')
    if (suppliersParam === 'true') {
      setMySuppliers(true)
    }
    if (specialParam === 'true') {
      setOnSpecial(true)
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

  // Persist boolean filters to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const updateBoolParam = (key: string, value: boolean) => {
      if (value) {
        if (params.get(key) !== 'true') {
          params.set(key, 'true')
          return true
        }
      } else if (params.has(key)) {
        params.delete(key)
        return true
      }
      return false
    }
    
    let changed = false
    changed = updateBoolParam('in_stock', inStock) || changed
    changed = updateBoolParam('my_suppliers', mySuppliers) || changed
    changed = updateBoolParam('special_only', onSpecial) || changed
    
    if (changed) setSearchParams(params, { replace: true })
  }, [inStock, mySuppliers, onSpecial, searchParams, setSearchParams])

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
    updateParam('categories', filters.category?.include?.join(',') || null)
    updateParam('categories_exclude', filters.category?.exclude?.join(',') || null)
    updateParam('suppliers', filters.supplier?.include?.join(',') || null)
    updateParam('suppliers_exclude', filters.supplier?.exclude?.join(',') || null)
    updateParam('brands', filters.brand?.include?.join(',') || null)
    updateParam('brands_exclude', filters.brand?.exclude?.join(',') || null)
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
    inStock,
    mySuppliers,
    onSpecial,
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
      inStock,
      mySuppliers,
      onSpecial,
      sort: sortOrder,
    })
  }, [filters, onlyWithPrice, inStock, mySuppliers, onSpecial, sortOrder])

  useEffect(() => {
    if (debouncedSearch) logSearch(debouncedSearch)
  }, [debouncedSearch])

  useEffect(() => {
    const brandTotal = (filters.brand?.include?.length || 0) + (filters.brand?.exclude?.length || 0)
    const categoryTotal = (filters.category?.include?.length || 0) + (filters.category?.exclude?.length || 0)
    const supplierTotal = (filters.supplier?.include?.length || 0) + (filters.supplier?.exclude?.length || 0)
    
    if (brandTotal > 0) logFacetInteraction('brand', `${filters.brand?.include?.join(',') || ''}|${filters.brand?.exclude?.join(',') || ''}`)
    if (categoryTotal > 0) logFacetInteraction('category', `${filters.category?.include?.join(',') || ''}|${filters.category?.exclude?.join(',') || ''}`)
    if (supplierTotal > 0) logFacetInteraction('supplier', `${filters.supplier?.include?.join(',') || ''}|${filters.supplier?.exclude?.join(',') || ''}`)
    if (filters.packSizeRange)
      logFacetInteraction('packSizeRange', JSON.stringify(filters.packSizeRange))
  }, [filters.brand, filters.category, filters.supplier, filters.packSizeRange])

  useEffect(() => {
    logFacetInteraction('onlyWithPrice', onlyWithPrice)
  }, [onlyWithPrice])

  useEffect(() => {
    logFacetInteraction('mySuppliers', mySuppliers)
  }, [mySuppliers])

  useEffect(() => {
    logFacetInteraction('special', onSpecial)
  }, [onSpecial])

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
        inStock,
        mySuppliers,
        onSpecial,
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
    inStock,
    mySuppliers,
    onSpecial,
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
  const showConnectBanner = hideConnectPill && !bannerDismissed && products.length > 0
  const sentinelKey = useMemo(
    () =>
      [
        viewKey,
        stringifiedFilters,
        sortOrder,
        inStock,
        mySuppliers,
        onSpecial,
        view,
      ].join(':'),
    [
      viewKey,
      stringifiedFilters,
      sortOrder,
      inStock,
      mySuppliers,
      onSpecial,
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

  const handleAdd = (product: any) => {
    setAddingId(product.catalog_id)
    const clear = () => setAddingId(null)
    if (typeof window !== 'undefined') {
      window.setTimeout(clear, 400)
    } else {
      setTimeout(clear, 400)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const shouldBeScrolled = window.scrollY > 0
    setScrolled(prev => (prev === shouldBeScrolled ? prev : shouldBeScrolled))
  }, [view])

  const total = totalCount

  const openFacetForChip = useCallback(
    (facet: keyof FacetFilters) => {
      setFocusedFacet(facet)
      setShowFilters(true)
    },
    [setFocusedFacet, setShowFilters],
  )

  const closeFilters = useCallback(() => {
    setShowFilters(false)
    setFocusedFacet(null)
    // Return focus to filter button if it exists
    if (filterButtonRef.current) {
      filterButtonRef.current.focus()
    }
  }, [setFocusedFacet, setShowFilters])

  // Keyboard shortcuts: Alt+F to toggle, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+F to toggle filters
      if (e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        setShowFilters(prev => {
          const next = !prev
          announceToScreenReader(next ? 'Filters panel opened' : 'Filters panel closed')
          return next
        })
      }
      // Escape to close filters
      if (e.key === 'Escape' && showFilters) {
        e.preventDefault()
        closeFilters()
        announceToScreenReader('Filters panel closed')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showFilters, closeFilters])

  // Focus trap when panel is open on desktop
  useEffect(() => {
    if (!showFilters) return
    
    const filterPanel = document.getElementById('catalog-filters-panel')
    if (!filterPanel) return

    const focusableElements = filterPanel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      // If shift+tab on first element, focus last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
      // If tab on last element, focus first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [showFilters])

  const chips = useMemo<ActiveFilterChip[]>(
    () => deriveChipsFromFilters(filters, setFilters, openFacetForChip),
    [filters, setFilters, openFacetForChip],
  )

  const activeFacetCount = chips.length
  const activeCount =
    (inStock ? 1 : 0) +
    (mySuppliers ? 1 : 0) +
    (onSpecial ? 1 : 0) +
    activeFacetCount

  return (
    <>
      <AppLayout
      headerRef={headerRef}
      header={
        <FiltersBar
          filters={filters}
          setFilters={setFilters}
          onlyWithPrice={onlyWithPrice}
          setOnlyWithPrice={setOnlyWithPrice}
          inStock={inStock}
          setInStock={setInStock}
          onSpecial={onSpecial}
          setOnSpecial={setOnSpecial}
          mySuppliers={mySuppliers}
          setMySuppliers={setMySuppliers}
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
          chips={chips}
          filterButtonRef={filterButtonRef}
        />
      }
      secondary={
        <div id="catalog-filters-panel" className="hidden h-full lg:flex">
          <CatalogFiltersPanel
            filters={filters}
            onChange={setFilters}
            focusedFacet={focusedFacet}
            onClearFilters={clearAllFilters}
            chips={chips}
          />
        </div>
      }
      panelOpen={showFilters}
    >
      <div
        className={cn(
          'mx-auto w-full max-w-[1600px] space-y-5 pb-8',
          view === 'grid' ? 'pt-2' : 'pt-2',
          // Add extra horizontal padding when no sidebars are visible
          !showFilters && 'px-4 sm:px-8 lg:px-12 xl:px-16',
        )}
      >
        {chips.length > 0 && (
          <div
            className="lg:hidden"
            style={{ '--ctrl-h': '32px', '--ctrl-r': '10px' } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-center gap-2 rounded-[var(--ctrl-r,12px)] bg-[color:var(--chip-bg)]/70 px-3 py-3 ring-1 ring-inset ring-[color:var(--ring-idle)] backdrop-blur-xl">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-dim)]/70">
                Active filters
              </span>
              {chips.map(chip => (
                <FilterChip
                  key={`mobile-${chip.key}`}
                  selected
                  onClick={() => chip.onEdit()}
                  onRemove={chip.onRemove}
                  className="shrink-0"
                >
                  {chip.label}
                </FilterChip>
              ))}
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="ml-auto text-sm font-medium text-[color:var(--ink-dim)]/80 underline decoration-white/20 underline-offset-4 transition hover:text-[color:var(--ink)]"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        )}

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
      <MobileFiltersDrawer
        open={showFilters}
        onClose={closeFilters}
        filters={filters}
        onChange={setFilters}
        focusedFacet={focusedFacet}
        onClearFilters={clearAllFilters}
        chips={chips}
      />
    </>
  )
}

interface FiltersBarProps {
  filters: FacetFilters
  setFilters: (f: Partial<FacetFilters>) => void
  onlyWithPrice: boolean
  setOnlyWithPrice: (v: boolean) => void
  inStock: boolean
  setInStock: (v: boolean) => void
  onSpecial: boolean
  setOnSpecial: (v: boolean) => void
  mySuppliers: boolean
  setMySuppliers: (v: boolean) => void
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
  chips: DerivedChip[]
  filterButtonRef?: React.RefObject<HTMLButtonElement>
}

function FiltersBar({
  filters,
  setFilters,
  onlyWithPrice: _onlyWithPrice,
  setOnlyWithPrice,
  inStock,
  setInStock,
  onSpecial,
  setOnSpecial,
  mySuppliers,
  setMySuppliers,
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
  chips,
  filterButtonRef,
}: FiltersBarProps) {
  const containerClass = 'mx-auto w-full max-w-[1600px]'
  const { search: _search, ...facetFilters } = filters
  const activeFacetCount = chips.length
  const activeCount =
    (inStock ? 1 : 0) +
    (mySuppliers ? 1 : 0) +
    (onSpecial ? 1 : 0) +
    activeFacetCount

  const clearAll = useCallback(() => {
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
    })
  }, [setInStock, setMySuppliers, setOnSpecial, setOnlyWithPrice, setFilters])

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

  const previousShowFiltersRef = useRef(showFilters)
  useEffect(() => {
    if (previousShowFiltersRef.current && !showFilters) {
      filterButtonRef.current?.focus()
    }
    previousShowFiltersRef.current = showFilters
  }, [showFilters, filterButtonRef])

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
  }, [showFilters, facetFilters, setFocusedFacet, setShowFilters])

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
              'inline-flex h-[var(--ctrl-h,40px)] items-center gap-3 rounded-[var(--ctrl-r,12px)] bg-[color:var(--chip-bg)] px-3 text-sm font-semibold text-[color:var(--ink-hi)] ring-1 ring-inset ring-[color:var(--ring-idle)] backdrop-blur-xl transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--toolbar-bg)] hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] hover:ring-[color:var(--ring-hover)] motion-reduce:transition-none',
              showFilters && 'bg-[color:var(--seg-active-bg)] text-[color:var(--ink-hi)] ring-[color:var(--ring-hover)]',
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
        style={{
          ...COMPACT_TOOLBAR_TOKENS,
        }}
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

        <div className={cn(containerClass, "lg:pl-30 xl:pl-42")}>
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
              <div className="relative min-w-0 w-full sm:w-auto sm:flex-none sm:min-w-[400px] sm:max-w-[600px]">
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
            <div className="lg:mr-auto">{renderFiltersToggleButton('shrink-0')}</div>
            {chips.map(chip => (
              <FilterChip
                key={chip.key}
                selected
                onClick={() => {
                  onLockChange?.(true)
                  chip.onEdit()
                }}
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

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
const MOBILE_DRAWER_TRANSITION_MS = 220

function usePrefersReducedMotionLocal() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return () => {}
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches)

    if ('addEventListener' in media) media.addEventListener('change', handler)
    // @ts-expect-error - addListener is deprecated but needed for older browsers
    else media.addListener(handler)

    setPrefersReducedMotion(media.matches)

    return () => {
      if ('removeEventListener' in media) media.removeEventListener('change', handler)
      // @ts-expect-error - removeListener is deprecated but needed for older browsers
      else media.removeListener(handler)
    }
  }, [])

  return prefersReducedMotion
}

interface MobileFiltersDrawerProps {
  open: boolean
  onClose: () => void
  filters: FacetFilters
  onChange: (f: Partial<FacetFilters>) => void
  focusedFacet: keyof FacetFilters | null
  onClearFilters: () => void
  chips: DerivedChip[]
}

function MobileFiltersDrawer({
  open,
  onClose,
  filters,
  onChange,
  focusedFacet,
  onClearFilters,
  chips,
}: MobileFiltersDrawerProps) {
  const prefersReducedMotion = usePrefersReducedMotionLocal()
  const [rendered, setRendered] = useState(open)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef<number | null>(null)
  const offsetRef = useRef(0)
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  useEffect(() => {
    if (open) {
      setRendered(true)
      requestAnimationFrame(() => {
        const first = contentRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        first?.focus()
      })
      return
    }

    startXRef.current = null
    offsetRef.current = 0
    setIsDragging(false)
    setDragOffset(0)

    if (prefersReducedMotion) {
      setRendered(false)
      return
    }

    const timeout = window.setTimeout(
      () => setRendered(false),
      MOBILE_DRAWER_TRANSITION_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [open, prefersReducedMotion])

  useEffect(() => {
    if (!rendered || typeof document === 'undefined' || isDesktop) return
    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'
    return () => {
      body.style.overflow = previousOverflow
    }
  }, [rendered, isDesktop])

  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return
      const container = contentRef.current
      if (!container) return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(element => !element.hasAttribute('disabled'))

      if (!focusable.length) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (!activeElement || activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else if (activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const drawer = drawerRef.current
    if (!drawer) return

    const handleTouchStart = (event: TouchEvent) => {
      startXRef.current = event.touches[0]?.clientX ?? null
      offsetRef.current = 0
      setIsDragging(true)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (startXRef.current == null) return
      const currentX = event.touches[0]?.clientX
      if (currentX == null) return
      const delta = currentX - startXRef.current
      if (delta <= 0) {
        offsetRef.current = 0
        setDragOffset(0)
        return
      }
      const width = drawer.getBoundingClientRect().width
      const nextOffset = Math.min(delta, width)
      offsetRef.current = nextOffset
      setDragOffset(nextOffset)
    }

    const handleTouchEnd = () => {
      const shouldClose = offsetRef.current > 90
      setIsDragging(false)
      setDragOffset(0)
      startXRef.current = null
      offsetRef.current = 0
      if (shouldClose) onClose()
    }

    drawer.addEventListener('touchstart', handleTouchStart, { passive: true })
    drawer.addEventListener('touchmove', handleTouchMove, { passive: true })
    drawer.addEventListener('touchend', handleTouchEnd)
    drawer.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      drawer.removeEventListener('touchstart', handleTouchStart)
      drawer.removeEventListener('touchmove', handleTouchMove)
      drawer.removeEventListener('touchend', handleTouchEnd)
      drawer.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [open, onClose])

  if (!rendered) return null

  const transition = prefersReducedMotion || isDragging ? 'none' : `transform var(--enter, 200ms ease-out)`
  const backdropTransition = prefersReducedMotion
    ? 'none'
    : `opacity ${MOBILE_DRAWER_TRANSITION_MS}ms var(--ease-snap, cubic-bezier(.22,1,.36,1))`

  return (
    <div className="fixed inset-0 z-[var(--z-modal,80)] flex lg:hidden" aria-hidden={!open}>
      <div
        className="flex-1 bg-[color:var(--overlay)]/70 backdrop-blur-sm"
        style={{
          opacity: open ? 1 : 0,
          transition: backdropTransition,
        }}
        onClick={onClose}
      />
      <div
        ref={drawerRef}
        className="relative h-full w-[min(92vw,360px)] max-w-full"
        style={{
          transform: open
            ? `translateX(${dragOffset}px)`
            : 'translateX(-100%)',
          transition,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div
          ref={contentRef}
          className="tw-pop flex h-full w-full flex-col overflow-hidden p-0"
          tabIndex={-1}
        >
          <CatalogFiltersPanel
            filters={filters}
            onChange={onChange}
            focusedFacet={focusedFacet}
            onClearFilters={onClearFilters}
            chips={chips}
            variant="drawer"
          />
        </div>
      </div>
    </div>
  )
}
