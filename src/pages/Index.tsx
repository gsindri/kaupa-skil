import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Settings, Zap } from 'lucide-react'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { PerformanceOptimizedList } from '@/components/quick/PerformanceOptimizedList'
import { PantryLanes } from '@/components/quick/PantryLanes'
import { BasketDrawer } from '@/components/cart/BasketDrawer'
import { MiniCompareDrawer } from '@/components/quick/MiniCompareDrawer'
import { SearchEmptyState } from '@/components/quick/SearchEmptyState'
import { AdvancedFiltering } from '@/components/quick/AdvancedFiltering'
import { BulkActions } from '@/components/quick/BulkActions'
import { SmartSuggestions } from '@/components/quick/SmartSuggestions'
import { EnhancedCartIntegration } from '@/components/quick/EnhancedCartIntegration'
import { KeyboardShortcuts } from '@/components/quick/KeyboardShortcuts'
import { CacheProvider } from '@/components/quick/CacheManager'
import { AnalyticsTrackerComponent } from '@/components/quick/AnalyticsTracker'
import { AccessibilityEnhancements } from '@/components/quick/AccessibilityEnhancements'
import VatToggle from '@/components/ui/VatToggle'
import { useCart } from '@/contexts/CartProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { useSupplierItems } from '@/hooks/useSupplierItems'
import { useDebounce } from '@/hooks/useDebounce'
import { PerformanceMonitor } from '@/lib/performance'
import { Kbd } from '@/components/ui/kbd'

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('')
  const [compareItemId, setCompareItemId] = useState<string | null>(null)
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [userMode, setUserMode] = useState<'just-order' | 'balanced' | 'analytical'>('just-order')
  const [selectedLane, setSelectedLane] = useState<string | null>(null)
  const [showKeyboardHelper, setShowKeyboardHelper] = useState(() => {
    const visits = localStorage.getItem('quick-order-visits') || '0'
    return parseInt(visits) < 3
  })
  
  // Phase 5 state
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [filters, setFilters] = useState({
    categories: [],
    suppliers: [],
    priceRange: [0, 10000] as [number, number],
    inStockOnly: false,
    sortBy: 'name' as 'name' | 'price' | 'brand',
    sortOrder: 'asc' as 'asc' | 'desc'
  })

  const { getTotalItems, setIsDrawerOpen, addItem } = useCart()
  const { includeVat, setIncludeVat } = useSettings()
  const { data: supplierItems = [], isLoading } = useSupplierItems()
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Track visits for keyboard helper
  useEffect(() => {
    const visits = parseInt(localStorage.getItem('quick-order-visits') || '0')
    if (visits < 3) {
      localStorage.setItem('quick-order-visits', (visits + 1).toString())
      if (visits + 1 >= 3) {
        setTimeout(() => setShowKeyboardHelper(false), 5000)
      }
    }
  }, [])

  // Enhanced filtering and sorting logic with performance monitoring
  const filteredAndSortedItems = useMemo(() => {
    PerformanceMonitor.startMeasurement('filtering-and-sorting')
    
    // Add mock pricing data to items
    const itemsWithPricing = supplierItems.map(item => {
      const seed = item.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
      const basePrice = 100 + (seed % 4900)
      
      return {
        ...item,
        unit_price_ex_vat: basePrice,
        unit_price_inc_vat: Math.round(basePrice * 1.24)
      }
    })

    let filtered = itemsWithPricing.filter(item => {
      // Text search
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase()
        const matchesSearch = 
          item.display_name?.toLowerCase().includes(query) ||
          item.ext_sku?.toLowerCase().includes(query) ||
          item.ean?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Category filter
      if (filters.categories.length > 0) {
        const hasCategory = filters.categories.some(cat => 
          item.display_name?.toLowerCase().includes(cat.toLowerCase())
        )
        if (!hasCategory) return false
      }

      // Supplier filter
      if (filters.suppliers.length > 0) {
        const supplierName = (item as any).supplier?.name || 'Unknown'
        if (!filters.suppliers.includes(supplierName)) return false
      }

      // Price filter
      const price = includeVat ? item.unit_price_inc_vat : item.unit_price_ex_vat
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false
      }

      // Stock filter
      if (filters.inStockOnly && !(item as any).stock) {
        return false
      }

      return true
    })

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'name':
          comparison = (a.display_name || '').localeCompare(b.display_name || '')
          break
        case 'price':
          const priceA = includeVat ? a.unit_price_inc_vat : a.unit_price_ex_vat
          const priceB = includeVat ? b.unit_price_inc_vat : b.unit_price_ex_vat
          comparison = priceA - priceB
          break
        case 'brand':
          comparison = (a.display_name || '').localeCompare(b.display_name || '')
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    PerformanceMonitor.endMeasurement('filtering-and-sorting')
    return filtered
  }, [supplierItems, debouncedSearch, filters, includeVat])

  // Convert to display format with optimized pricing calculation
  const displayItems = useMemo(() => {
    PerformanceMonitor.startMeasurement('display-items-conversion')
    
    const items = filteredAndSortedItems.map(item => {
      const unitPriceExVat = item.unit_price_ex_vat
      const unitPriceIncVat = item.unit_price_inc_vat
      const packQty = item.pack_qty || 1
      
      return {
        id: item.id,
        name: item.display_name || 'Unknown Item',
        brand: (item as any).supplier?.name || 'Unknown Brand',
        packSize: item.pack_qty ? `${item.pack_qty} ${(item as any).pack_unit?.code || 'units'}` : '1 unit',
        unitPriceExVat,
        unitPriceIncVat,
        packPriceExVat: unitPriceExVat * packQty,
        packPriceIncVat: unitPriceIncVat * packQty,
        unit: (item as any).pack_unit?.code || 'unit',
        suppliers: [(item as any).supplier?.name || 'Unknown Supplier'],
        stock: true,
        deliveryFee: Math.random() > 0.7 ? Math.floor(Math.random() * 3000) + 1000 : undefined,
        cutoffTime: Math.random() > 0.5 ? '14:00' : undefined,
        deliveryDay: Math.random() > 0.5 ? 'Tomorrow' : undefined,
        isPremiumBrand: Math.random() > 0.8,
        isDiscounted: Math.random() > 0.9,
        originalPrice: Math.random() > 0.9 ? unitPriceIncVat * 1.2 : undefined
      }
    })
    
    PerformanceMonitor.endMeasurement('display-items-conversion')
    return items
  }, [filteredAndSortedItems])

  // Get available categories and suppliers for filtering
  const availableCategories = [
    'Dairy Products', 'Fresh Produce', 'Meat & Seafood', 
    'Bakery Items', 'Cleaning Supplies', 'Beverages'
  ]
  
  const availableSuppliers = [...new Set(
    supplierItems.map(item => (item as any).supplier?.name).filter(Boolean)
  )]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            break
          case 'a':
            e.preventDefault()
            if (displayItems.length > 0) {
              setSelectedItems(displayItems.map(item => item.id))
            }
            break
          case 'd':
            e.preventDefault()
            setSelectedItems([])
            break
          case 'b':
            e.preventDefault()
            setIsDrawerOpen(true)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [displayItems, setIsDrawerOpen])

  const handleSelectAll = () => {
    setSelectedItems(displayItems.map(item => item.id))
  }

  const handleClearSelection = () => {
    setSelectedItems([])
  }

  const handleBulkAddToCart = (quantity: number) => {
    selectedItems.forEach(itemId => {
      const item = displayItems.find(i => i.id === itemId)
      if (item) {
        addItem({
          id: item.id,
          supplierId: item.suppliers[0],
          supplierName: item.suppliers[0],
          itemName: item.name,
          sku: item.id,
          packSize: item.packSize,
          packPrice: includeVat ? item.packPriceIncVat : item.packPriceExVat,
          unitPriceExVat: item.unitPriceExVat,
          unitPriceIncVat: item.unitPriceIncVat,
          vatRate: 0.24,
          unit: item.unit,
          supplierItemId: item.id,
          displayName: item.name,
          packQty: 1
        }, quantity)
      }
    })
    setSelectedItems([])
  }

  const handleBulkRemoveFromCart = () => {
    setSelectedItems([])
  }

  const handleAddSuggestedItem = (itemId: string) => {
    const item = displayItems.find(i => i.id === itemId)
    if (item) {
      addItem({
        id: item.id,
        supplierId: item.suppliers[0],
        supplierName: item.suppliers[0],
        itemName: item.name,
        sku: item.id,
        packSize: item.packSize,
        packPrice: includeVat ? item.packPriceIncVat : item.packPriceExVat,
        unitPriceExVat: item.unitPriceExVat,
        unitPriceIncVat: item.unitPriceIncVat,
        vatRate: 0.24,
        unit: item.unit,
        supplierItemId: item.id,
        displayName: item.name,
        packQty: 1
      }, 1)
    }
  }

  const handleCompareItem = (itemId: string) => {
    setCompareItemId(itemId)
    setIsCompareOpen(true)
  }

  const showResults = debouncedSearch.trim().length > 0 || selectedLane
  const hasResults = displayItems.length > 0

  return (
    <CacheProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        {/* Accessibility Enhancements */}
        <AccessibilityEnhancements />
        
        {/* Analytics Tracker */}
        <AnalyticsTrackerComponent 
          searchQuery={debouncedSearch}
          resultCount={displayItems.length}
          userMode={userMode}
        />

        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Zap className="h-6 w-6 text-brand-600" />
                  <h1 className="text-xl font-semibold text-foreground">Quick Order</h1>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <VatToggle 
                  includeVat={includeVat} 
                  onToggle={setIncludeVat}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Basket · {getTotalItems()}
                  {getTotalItems() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getTotalItems()}
                    </span>
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Mode selector - right-aligned under title */}
            <div className="flex justify-end mt-2">
              <div className="inline-flex items-center bg-muted rounded-lg p-1">
                {(['just-order', 'balanced', 'analytical'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setUserMode(mode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      userMode === mode
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    {mode === 'just-order' ? 'Just Order' : mode === 'balanced' ? 'Balanced' : 'Analytical'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="max-w-2xl mx-auto space-y-2">
            <QuickSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onResultSelect={(item) => {
                setSearchQuery('')
                handleAddSuggestedItem(item.id)
              }}
            />
            
            {/* Keyboard shortcuts helper */}
            {showKeyboardHelper && (
              <div className="text-xs text-muted-foreground text-center space-x-4 animate-fade-in">
                <span>Shortcuts:</span>
                <span><Kbd>/</Kbd> search</span>
                <span><Kbd>Enter</Kbd> add</span>
                <span><Kbd>B</Kbd> basket</span>
                <span><Kbd>↑/↓</Kbd> qty</span>
              </div>
            )}
          </div>

          {(showResults || selectedItems.length > 0) && (
            <AdvancedFiltering
              filters={filters}
              onFiltersChange={setFilters}
              availableCategories={availableCategories}
              availableSuppliers={availableSuppliers}
            />
          )}

          <BulkActions
            selectedItems={selectedItems}
            allItems={displayItems}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkAddToCart={handleBulkAddToCart}
            onBulkRemoveFromCart={handleBulkRemoveFromCart}
          />

          {!showResults && (
            <div className="max-w-4xl mx-auto">
              <SmartSuggestions onAddSuggestedItem={handleAddSuggestedItem} />
            </div>
          )}

          <div className="max-w-6xl mx-auto">
            {showResults ? (
              hasResults ? (
                <PerformanceOptimizedList
                  items={displayItems}
                  onCompareItem={handleCompareItem}
                  userMode={userMode}
                  selectedItems={selectedItems}
                  onItemSelect={(itemId, isSelected) => {
                    if (isSelected) {
                      setSelectedItems(prev => [...prev, itemId])
                    } else {
                      setSelectedItems(prev => prev.filter(id => id !== itemId))
                    }
                  }}
                />
              ) : (
                <SearchEmptyState 
                  query={debouncedSearch}
                  onClearSearch={() => setSearchQuery('')}
                />
              )
            ) : (
              <PantryLanes
                onLaneSelect={setSelectedLane}
                selectedLane={selectedLane}
                onAddToCart={handleAddSuggestedItem}
              />
            )}
          </div>
        </main>

        <EnhancedCartIntegration />
        <BasketDrawer />
        <MiniCompareDrawer
          itemId={compareItemId}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
        <KeyboardShortcuts onClose={() => {}} />
      </div>
    </CacheProvider>
  )
}
