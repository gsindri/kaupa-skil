
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
      {/* Header - exact 56px height with proper backdrop blur */}
      <div className="sticky top-0 z-40 h-14 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-foreground/10">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-brand-500" />
              <h1 className="text-lg font-semibold">Quick Order</h1>
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

          {/* Center: Search - 600-720px wide on desktop */}
          <div className="flex-1 max-w-2xl mx-8">
            <QuickSearch
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value)
                if (value.trim()) {
                  setActiveTab('search')
                }
              }}
              placeholder="Search item / brand / EAN…"
            />
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
              className="relative transition-all duration-200 hover:scale-105 bg-brand-500 hover:bg-brand-600"
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

      {/* Main Content - max-width 1280px with proper spacing */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-12 gap-6 py-6">
          {/* Left 8 columns: Search/Pantry */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Content Tabs */}
            <div className="flex gap-2">
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
                    <div className="space-y-3">
                      {/* Use virtualization for large lists */}
                      {filteredItems.length > 50 ? (
                        <VirtualizedItemList
                          items={filteredItems}
                          height={600}
                          itemHeight={120}
                          userMode={userMode}
                        />
                      ) : (
                        <div className="grid gap-3">
                          {filteredItems.map((item, index) => (
                            <div
                              key={item.id}
                              className="animate-scale-in"
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
                      <p>No results. Try brand or EAN.</p>
                      <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => setActiveTab('pantry')}
                      >
                        Browse Pantry
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Right 4 columns: Basket context & tips */}
          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-20 space-y-4">
              {/* Basket summary card would go here */}
              <Card className="rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {basketItemCount > 0 ? (
                      <p>{basketItemCount} items in basket</p>
                    ) : (
                      <p>Your basket is empty</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <BasketDrawer />
    </div>
  )
}
