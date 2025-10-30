import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/useAuth'
import { useBasket } from '@/contexts/useBasket'
import { useCatalogProducts } from '@/hooks/useCatalogProducts'
import { useOrgCatalog } from '@/hooks/useOrgCatalog'
import { CatalogGrid } from '@/components/catalog/CatalogGrid'
import { CatalogTable } from '@/components/catalog/CatalogTable'
import { useGatedAction } from '@/hooks/useGatedAction'
import { SignUpPromptModal } from '@/components/auth/SignUpPromptModal'
import { CatalogFiltersPanel, type ActiveFilterChip } from '@/components/catalog/CatalogFiltersPanel'
import { SortDropdown } from '@/components/catalog/SortDropdown'
import { ViewToggle } from '@/components/place-order/ViewToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterChip } from '@/components/ui/filter-chip'
import { Sheet, SheetContent, SheetPortal } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCatalogFilters, SortOrder } from '@/state/catalogFiltersStore'
import { useDebounce } from '@/hooks/useDebounce'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { FacetFilters } from '@/services/catalog'
import { MagnifyingGlass, FunnelSimple, XCircle } from '@phosphor-icons/react'
import { rememberScroll } from '@/lib/scrollMemory'
import { ContentRail } from '@/components/layout/ContentRail'

interface CatalogShellProps {
  mode: 'public' | 'authenticated'
}

const COMPACT_TOOLBAR_TOKENS = {
  '--ctrl-h': '36px',
  '--ctrl-r': '10px',
  '--icon-btn': '36px',
} as React.CSSProperties

export function CatalogShell({ mode }: CatalogShellProps) {
  const isPublicMode = mode === 'public'
  const { user, profile } = useAuth()
  const { addItem } = useBasket()
  const { gateAction, showAuthModal, closeAuthModal, pendingActionName } = useGatedAction()
  const orgId = profile?.tenant_id || ''
  
  const [addingId, setAddingId] = useState<string | null>(null)
  
  // State management
  const filters = useCatalogFilters(s => s.filters)
  const setFilters = useCatalogFilters(s => s.setFilters)
  const onlyWithPrice = useCatalogFilters(s => s.onlyWithPrice)
  const sortOrder = useCatalogFilters(s => s.sort)
  const setSortOrder = useCatalogFilters(s => s.setSort)
  const inStock = useCatalogFilters(s => s.inStock)
  const setInStock = useCatalogFilters(s => s.setInStock)
  const onSpecial = useCatalogFilters(s => s.onSpecial)
  const setOnSpecial = useCatalogFilters(s => s.setOnSpecial)
  const mySuppliers = useCatalogFilters(s => s.mySuppliers)
  const setMySuppliers = useCatalogFilters(s => s.setMySuppliers)
  
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [focusedFacet, setFocusedFacet] = useState<keyof FacetFilters | null>(null)
  const [tableSort, setTableSort] = useState<{
    key: 'name' | 'supplier' | 'price' | 'availability'
    direction: 'asc' | 'desc'
  } | null>({ key: 'name', direction: 'asc' })
  
  const debouncedSearch = useDebounce(filters.search ?? '', 300)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const searchRef = useRef<HTMLInputElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement | null>(null)
  
  // Data fetching
  const availability = inStock ? ['IN_STOCK'] : undefined
  const publicFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
    ...(onlyWithPrice ? { onlyWithPrice: true } : {}),
    ...(onSpecial ? { onSpecial: true } : {}),
    ...(availability ? { availability } : {}),
  }), [filters, debouncedSearch, onlyWithPrice, onSpecial, availability])
  
  const orgFilters = useMemo(() => ({
    ...filters,
    search: debouncedSearch || undefined,
    onlyWithPrice,
    ...(mySuppliers ? { mySuppliers: 'include' as const } : {}),
    ...(onSpecial ? { onSpecial: true } : {}),
    ...(availability ? { availability } : {}),
  }), [filters, debouncedSearch, onlyWithPrice, mySuppliers, onSpecial, availability])
  
  const publicQuery = useCatalogProducts(publicFilters, sortOrder)
  const orgQuery = useOrgCatalog(orgId, orgFilters, sortOrder)
  
  const currentQuery = isPublicMode ? publicQuery : (orgId ? orgQuery : publicQuery)
  const products = useMemo(() => currentQuery.data ?? [], [currentQuery.data])
  const totalCount = currentQuery.total
  const { hasNextPage, isFetchingNextPage, loadMore } = currentQuery
  
  // Filter chips
  const chips = useMemo<ActiveFilterChip[]>(() => {
    const result: ActiveFilterChip[] = []
    
    if (inStock) {
      result.push({
        key: 'inStock',
        label: 'In Stock',
        variant: 'boolean',
        onRemove: () => setInStock(false),
        onEdit: () => {},
      })
    }
    
    if (onSpecial) {
      result.push({
        key: 'onSpecial',
        label: 'On Special',
        variant: 'boolean',
        onRemove: () => setOnSpecial(false),
        onEdit: () => {},
      })
    }
    
    if (mySuppliers && !isPublicMode) {
      result.push({
        key: 'mySuppliers',
        label: 'My Suppliers',
        variant: 'boolean',
        onRemove: () => setMySuppliers(false),
        onEdit: () => {},
      })
    }
    
    return result
  }, [inStock, onSpecial, mySuppliers, isPublicMode, setInStock, setOnSpecial, setMySuppliers])
  
  const clearAllFilters = useCallback(() => {
    setInStock(false)
    setMySuppliers(false)
    setOnSpecial(false)
    setFilters({
      brand: undefined,
      category: undefined,
      supplier: undefined,
      packSizeRange: undefined,
    })
  }, [setFilters, setInStock, setMySuppliers, setOnSpecial])
  
  // Handlers
  const handleAddToCart = useCallback((product: any, supplierId?: string) => {
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
  }, [isPublicMode, gateAction, addItem])
  
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      loadMore()
    }
  }, [hasNextPage, isFetchingNextPage, loadMore])
  
  const sortedProducts = useMemo(() => {
    if (!tableSort) return products
    const sorted = [...products]
    sorted.sort((a, b) => {
      let av: any, bv: any
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
          const order: Record<string, number> = { IN_STOCK: 0, LOW_STOCK: 1, OUT_OF_STOCK: 2, UNKNOWN: 3 }
          av = order[a.availability_status] ?? 3
          bv = order[b.availability_status] ?? 3
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
  
  return (
    <>
      <Sheet open={isDesktop && showFilters} onOpenChange={setShowFilters}>
        <div className="w-full">
          {/* Toolbar */}
          <section
            style={{ 
              ...COMPACT_TOOLBAR_TOKENS, 
              position: 'sticky',
              top: 'calc(var(--header-h, 56px) * (1 - var(--header-hidden, 0)))',
              transform: 'translate3d(0, calc(-100% * var(--header-hidden, 0)), 0)',
              transition: 'transform 200ms ease-in-out, top 200ms ease-in-out',
              zIndex: 'var(--z-toolbar, 40)',
            }}
            className="bg-[color:var(--toolbar-bg)] backdrop-blur-xl after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/12"
          >
            <ContentRail>
              <div className="catalog-toolbar flex flex-col gap-3 py-3">
                <div className="catalog-toolbar-zones">
                  <div className="toolbar-left">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          ref={filterButtonRef}
                          onClick={() => setShowFilters(!showFilters)}
                          aria-pressed={showFilters}
                          className={cn(
                            'inline-flex h-[var(--ctrl-h,40px)] items-center gap-3 rounded-[var(--ctrl-r,12px)] border border-transparent bg-[color:var(--chip-bg)] px-3 text-sm font-semibold text-[color:var(--ink-hi)] backdrop-blur-xl transition',
                            showFilters && 'bg-[color:var(--seg-active-bg)] border-[color:var(--ring-hover)]'
                          )}
                        >
                          <FunnelSimple size={24} weight="fill" />
                          <span className="hidden sm:inline">
                            {chips.length ? `Filters (${chips.length})` : 'Filters'}
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Filters</TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="toolbar-center flex min-w-[220px] items-center gap-3">
                    <div className="relative flex-1">
                      <Input
                        ref={searchRef}
                        type="search"
                        placeholder="Search products"
                        value={filters.search ?? ''}
                        onChange={(e) => setFilters({ search: e.target.value })}
                        className="h-11 w-full rounded-[var(--ctrl-r,14px)] border-transparent bg-white pl-12 pr-12 text-base font-semibold shadow-[0_12px_38px_rgba(7,18,30,0.26)]"
                      />
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                        <MagnifyingGlass size={22} weight="fill" />
                      </span>
                      {filters.search && (
                        <button
                          type="button"
                          onClick={() => setFilters({ search: '' })}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-200/70"
                        >
                          <XCircle size={20} weight="fill" />
                        </button>
                      )}
                    </div>
                    
                    {totalCount != null && (
                      <div className="hidden items-center text-sm font-semibold text-[color:var(--ink-hi)] lg:flex">
                        <span className="tabular-nums">{totalCount.toLocaleString()}</span>
                        <span className="ml-1 font-normal text-[color:var(--ink-lo)]">results</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="toolbar-right lg:flex-nowrap lg:gap-4">
                    <SortDropdown value={sortOrder} onChange={setSortOrder} />
                    <ViewToggle
                      value={view}
                      onChange={(v) => {
                        rememberScroll(`catalog:${view}`)
                        setView(v)
                      }}
                    />
                  </div>
                </div>
                
                {chips.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {chips.map(chip => (
                      <FilterChip
                        key={chip.key}
                        variant={chip.variant}
                        onRemove={chip.onRemove}
                        className="flex-none"
                      >
                        {chip.label}
                      </FilterChip>
                    ))}
                    {chips.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="flex-none text-sm font-medium text-destructive/80 hover:text-destructive"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                )}
              </div>
            </ContentRail>
          </section>
          
          {/* Grid/Table - Mirror ContentRail structure */}
          <div style={{ paddingLeft: 'var(--layout-rail,72px)' }}>
            <div 
              className="mx-auto w-full" 
              style={{ 
                maxWidth: 'var(--page-max)', 
                paddingInline: 'var(--page-gutter)' 
              }}
            >
              <div className="space-y-5 pb-8 pt-2">
            {view === 'grid' ? (
              <CatalogGrid
                products={displayProducts}
                onAddToCart={handleAddToCart}
                onNearEnd={handleLoadMore}
                showPrice={!isPublicMode}
                addingId={addingId}
                mode={mode}
              />
            ) : (
              <CatalogTable
                products={displayProducts}
                sort={tableSort}
                onSort={(key) => {
                  setTableSort(prev => {
                    if (prev && prev.key === key) {
                      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                    }
                    return { key, direction: 'asc' }
                  })
                }}
              />
            )}
            
            {hasNextPage && (
              <div className="flex justify-center py-6">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load more'}
                </Button>
              </div>
              )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Desktop Filters Panel */}
        {isDesktop && showFilters && (
          <>
            <SheetPortal>
              <div
                className="fixed inset-y-0 right-0 bg-[color:var(--overlay)] backdrop-blur-sm z-[calc(var(--z-drawer,80)-1)]"
                style={{ left: 'var(--layout-rail,72px)' }}
                onClick={() => setShowFilters(false)}
              />
            </SheetPortal>
            <SheetContent
              side="left"
              hideOverlay
              className="hidden h-full p-0 bg-[color:var(--filters-bg)] lg:flex"
              style={{ left: 'var(--layout-rail,72px)', width: 'clamp(280px, 24vw, 360px)' }}
            >
              <div className="flex h-full w-full flex-col overflow-hidden">
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
          </>
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
