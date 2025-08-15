import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Settings, Zap } from 'lucide-react'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { VirtualizedItemList } from '@/components/quick/VirtualizedItemList'
import { PantryLanes } from '@/components/quick/PantryLanes'
import { BasketDrawer } from '@/components/cart/BasketDrawer'
import { MiniCompareDrawer } from '@/components/quick/MiniCompareDrawer'
import { SearchEmptyState } from '@/components/quick/SearchEmptyState'
import { AdvancedFiltering } from '@/components/quick/AdvancedFiltering'
import { BulkActions } from '@/components/quick/BulkActions'
import { SmartSuggestions } from '@/components/quick/SmartSuggestions'
import { EnhancedCartIntegration } from '@/components/quick/EnhancedCartIntegration'
import { KeyboardShortcuts } from '@/components/quick/KeyboardShortcuts'
import { useCart } from '@/contexts/CartProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { useSupplierItems } from '@/hooks/useSupplierItems'
import { useDebounce } from '@/hooks/useDebounce'

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('')
  const [compareItemId, setCompareItemId] = useState<string | null>(null)
  const [isCompareOpen, setIsCompareOpen] = useState(false)
  const [userMode, setUserMode] = useState<'just-order' | 'balanced' | 'analytical'>('balanced')
  const [selectedLane, setSelectedLane] = useState<string | null>(null)
  
  // New Phase 5 state
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
  const { includeVat } = useSettings()
  const { data: supplierItems = [], isLoading } = useSupplierItems()
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Enhanced filtering and sorting logic
  const filteredAndSortedItems = useMemo(() => {
    let filtered = supplierItems.filter(item => {
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
        // This would need proper category data from the API
        // For now, we'll use a placeholder check
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

      // Price range filter
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
          // Would need brand data from API
          comparison = (a.display_name || '').localeCompare(b.display_name || '')
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [supplierItems, debouncedSearch, filters, includeVat])

  // Convert to display format
  const displayItems = filteredAndSortedItems.map(item => ({
    id: item.id,
    name: item.display_name || 'Unknown Item',
    brand: (item as any).supplier?.name || 'Unknown Brand',
    packSize: item.pack_qty ? `${item.pack_qty} ${(item as any).pack_unit?.code || 'units'}` : '1 unit',
    unitPriceExVat: item.unit_price_ex_vat || 0,
    unitPriceIncVat: item.unit_price_inc_vat || 0,
    packPriceExVat: (item.unit_price_ex_vat || 0) * (item.pack_qty || 1),
    packPriceIncVat: (item.unit_price_inc_vat || 0) * (item.pack_qty || 1),
    unit: (item as any).pack_unit?.code || 'unit',
    suppliers: [(item as any).supplier?.name || 'Unknown Supplier'],
    stock: true, // Would need real stock data
    deliveryFee: Math.random() > 0.7 ? Math.floor(Math.random() * 3000) + 1000 : undefined,
    cutoffTime: Math.random() > 0.5 ? '14:00' : undefined,
    deliveryDay: Math.random() > 0.5 ? 'Tomorrow' : undefined,
    isPremiumBrand: Math.random() > 0.8,
    isDiscounted: Math.random() > 0.9,
    originalPrice: Math.random() > 0.9 ? (item.unit_price_inc_vat || 0) * 1.2 : undefined
  }))

  // Get available categories and suppliers for filtering
  const availableCategories = [
    'Dairy Products', 'Fresh Produce', 'Meat & Seafood', 
    'Bakery Items', 'Cleaning Supplies', 'Beverages'
  ]
  
  const availableSuppliers = [...new Set(
    supplierItems.map(item => (item as any).supplier?.name).filter(Boolean)
  )]

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            // Focus search - handled by QuickSearch component
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

  // Bulk actions handlers
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
    // Implementation would depend on cart structure
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-brand-600" />
                <h1 className="text-xl font-bold text-foreground">Quick Order</h1>
              </div>
              
              {/* Mode Selector */}
              <div className="hidden md:flex items-center space-x-1 bg-muted/50 rounded-lg p-1">
                {(['just-order', 'balanced', 'analytical'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setUserMode(mode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      userMode === mode
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                    }`}
                  >
                    {mode === 'just-order' ? 'Just Order' : mode === 'balanced' ? 'Balanced' : 'Analytical'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="relative"
                onClick={() => setIsDrawerOpen(true)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <QuickSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onResultSelect={(item) => {
              setSearchQuery('')
              handleAddSuggestedItem(item.id)
            }}
          />
        </div>

        {/* Advanced Filtering */}
        {(showResults || selectedItems.length > 0) && (
          <AdvancedFiltering
            filters={filters}
            onFiltersChange={setFilters}
            availableCategories={availableCategories}
            availableSuppliers={availableSuppliers}
          />
        )}

        {/* Bulk Actions */}
        <BulkActions
          selectedItems={selectedItems}
          allItems={displayItems}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkAddToCart={handleBulkAddToCart}
          onBulkRemoveFromCart={handleBulkRemoveFromCart}
        />

        {/* Smart Suggestions */}
        {!showResults && (
          <div className="max-w-4xl mx-auto">
            <SmartSuggestions onAddSuggestedItem={handleAddSuggestedItem} />
          </div>
        )}

        {/* Content Area */}
        <div className="max-w-6xl mx-auto">
          {showResults ? (
            hasResults ? (
              <VirtualizedItemList
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

      {/* Enhanced Cart Integration */}
      <EnhancedCartIntegration />

      {/* Drawers and Modals */}
      <BasketDrawer />
      <MiniCompareDrawer
        itemId={compareItemId}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />
      <KeyboardShortcuts onClose={() => {}} />
    </div>
  )
}
