import React, { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Zap, ShoppingCart, Settings } from 'lucide-react'
import { useCart } from '@/contexts/CartProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { getUserPrefs, saveUserPrefs } from '@/state/userPrefs'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { PantryLanes } from '@/components/quick/PantryLanes'
import { VirtualizedItemList } from '@/components/quick/VirtualizedItemList'
import { BasketDrawer } from '@/components/cart/BasketDrawer'
import { useSupplierItems } from '@/hooks/useSupplierItems'

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'pantry' | 'search'>('pantry')
  const { setIsDrawerOpen, getTotalItems } = useCart()
  const { includeVat, setIncludeVat } = useSettings()
  const { data: supplierItems = [], isLoading } = useSupplierItems()
  
  // Get user preferences
  const userPrefs = getUserPrefs()
  const [userMode, setUserMode] = useState(userPrefs.userMode)

  // Handle VAT toggle with smooth animation
  const handleVatToggle = useCallback(() => {
    setIncludeVat(!includeVat)
  }, [includeVat, setIncludeVat])

  // Handle mode change
  const handleModeChange = useCallback((mode: 'just-order' | 'balanced' | 'analytical') => {
    setUserMode(mode)
    saveUserPrefs({ userMode: mode })
  }, [])

  // Filtered and sorted items with performance optimization
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return supplierItems
      .filter(item => 
        item.display_name?.toLowerCase().includes(query) ||
        item.ext_sku?.toLowerCase().includes(query) ||
        item.ean?.toLowerCase().includes(query)
      )
      .slice(0, 100) // Limit results for performance
  }, [supplierItems, searchQuery])

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'b' || e.key === 'B') {
        if (e.target === document.body || (e.target as HTMLElement).tagName === 'INPUT') {
          setIsDrawerOpen(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setIsDrawerOpen])

  const basketItemCount = getTotalItems()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold">Quick Order</h1>
            </div>
            
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['just-order', 'balanced', 'analytical'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={userMode === mode ? 'default' : 'ghost'}
                  size="sm"
                  className={`h-7 text-xs transition-all duration-200 ${
                    userMode === mode ? 'bg-background shadow-sm' : ''
                  }`}
                  onClick={() => handleModeChange(mode)}
                >
                  {mode === 'just-order' ? 'Quick' : mode === 'balanced' ? 'Balanced' : 'Detail'}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* VAT Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleVatToggle}
              className="transition-all duration-200"
            >
              <span className={`transition-opacity duration-200 ${includeVat ? 'opacity-100' : 'opacity-50'}`}>
                Inc VAT
              </span>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <span className={`transition-opacity duration-200 ${!includeVat ? 'opacity-100' : 'opacity-50'}`}>
                Ex VAT
              </span>
            </Button>

            {/* Basket Button */}
            <Button
              variant="default"
              onClick={() => setIsDrawerOpen(true)}
              className="relative transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Basket
              {basketItemCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 bg-background text-foreground animate-pulse"
                >
                  {basketItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Global Search */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <QuickSearch
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value)
                if (value.trim()) {
                  setActiveTab('search')
                }
              }}
              placeholder="Search by name, SKU, or EAN..."
            />
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'pantry' ? 'default' : 'outline'}
            onClick={() => setActiveTab('pantry')}
            className="transition-all duration-200"
          >
            Pantry
          </Button>
          <Button
            variant={activeTab === 'search' ? 'default' : 'outline'}
            onClick={() => setActiveTab('search')}
            disabled={!searchQuery.trim()}
            className="transition-all duration-200"
          >
            Search Results
            {filteredItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredItems.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Content Area */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'pantry' ? (
            <PantryLanes userMode={userMode} />
          ) : (
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Searching...</p>
                </div>
              ) : filteredItems.length > 0 ? (
                <div className="space-y-2">
                  {/* Use virtualization for large lists */}
                  {filteredItems.length > 50 ? (
                    <VirtualizedItemList
                      items={filteredItems}
                      height={600}
                      itemHeight={120}
                      userMode={userMode}
                    />
                  ) : (
                    <div className="grid gap-2">
                      {filteredItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="animate-in fade-in slide-in-from-bottom-2"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* ItemCard will be rendered here */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No items found for "{searchQuery}"</p>
                  <p className="text-sm">Try searching by name, SKU, or EAN</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <BasketDrawer />
    </div>
  )
}
