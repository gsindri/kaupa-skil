
import React, { useState } from 'react'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { VirtualizedSupplierItemsList } from '@/components/quick/VirtualizedSupplierItemsList'
import { SmartCartSidebar } from '@/components/quick/SmartCartSidebar'
import { SmartSuggestions } from '@/components/quick/SmartSuggestions'
import { DeliveryOptimizationBanner } from '@/components/quick/DeliveryOptimizationBanner'
import { QuickOrderNavigation } from '@/components/quick/QuickOrderNavigation'
import { AccessibilityEnhancements } from '@/components/quick/AccessibilityEnhancements'
import { KeyboardShortcuts } from '@/components/quick/KeyboardShortcuts'
import { AnalyticsTrackerComponent } from '@/components/quick/AnalyticsTracker'
import { CacheProvider } from '@/components/quick/CacheManager'
import { BulkActions } from '@/components/quick/BulkActions'
import { MiniCompareDrawer } from '@/components/quick/MiniCompareDrawer'
import { AdvancedFiltering } from '@/components/quick/AdvancedFiltering'
import { CompactOrderGuidesCTA } from '@/components/quick/CompactOrderGuidesCTA'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { QuickOrderErrorFallback } from '@/components/quick/QuickOrderErrorFallback'

function QuickOrder() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [compareItemId, setCompareItemId] = useState<string | null>(null)
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false)
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)
  const [filters, setFilters] = useState({
    categories: [],
    suppliers: [],
    priceRange: [0, 10000] as [number, number],
    inStockOnly: false,
    sortBy: 'name' as 'name' | 'price' | 'brand',
    sortOrder: 'asc' as 'asc' | 'desc'
  })

  const mockItems = [
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' }
  ]

  const handleSelectAll = () => {
    setSelectedItems(mockItems.map(item => item.id))
  }

  const handleClearSelection = () => {
    setSelectedItems([])
  }

  const handleBulkAddToCart = (quantity: number) => {
    console.log('Adding selected items to cart:', selectedItems, 'quantity:', quantity)
  }

  const handleBulkRemoveFromCart = () => {
    console.log('Removing selected items from cart:', selectedItems)
  }

  const handleCompareItem = (itemId: string) => {
    setCompareItemId(itemId)
    setIsCompareDrawerOpen(true)
  }

  const handleAddSuggestedItem = (itemId: string) => {
    console.log('Adding suggested item:', itemId)
  }

  const handleItemSelect = (itemId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  return (
    <CacheProvider>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-screen">
        {/* Main Content Area */}
        <main className="lg:col-span-3 flex flex-col">
          <ErrorBoundary fallback={<QuickOrderErrorFallback />}>
            <QuickOrderNavigation />
            <QuickSearch />
            <SmartSuggestions onAddSuggestedItem={handleAddSuggestedItem} />
            <BulkActions 
              selectedItems={selectedItems}
              allItems={mockItems}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkAddToCart={handleBulkAddToCart}
              onBulkRemoveFromCart={handleBulkRemoveFromCart}
            />
            <AdvancedFiltering 
              filters={filters}
              onFiltersChange={setFilters}
              availableCategories={['Dairy', 'Bakery', 'Meat']}
              availableSuppliers={['Costco', 'Metro', 'Nordic']}
            />
            <VirtualizedSupplierItemsList 
              onCompareItem={handleCompareItem}
              userMode="balanced"
              selectedItems={selectedItems}
              onItemSelect={handleItemSelect}
            />
          </ErrorBoundary>
        </main>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <ErrorBoundary fallback={<QuickOrderErrorFallback />}>
            <SmartCartSidebar />
            <DeliveryOptimizationBanner />
            <CompactOrderGuidesCTA />
            <MiniCompareDrawer 
              itemId={compareItemId}
              isOpen={isCompareDrawerOpen}
              onClose={() => setIsCompareDrawerOpen(false)}
            />
          </ErrorBoundary>
        </aside>

        {/* Accessibility and Utilities */}
        <AccessibilityEnhancements />
        <KeyboardShortcuts onClose={() => setIsKeyboardShortcutsOpen(false)} />
        <AnalyticsTrackerComponent />
      </div>
    </CacheProvider>
  )
}

export default QuickOrder
