
import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { useComparison } from '@/contexts/ComparisonContext'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'
import { Database } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CompactOrderGuidesCTA } from '@/components/order-guides/CompactOrderGuidesCTA'
import { QuickSearch } from '@/components/quick/QuickSearch'
import { QuickOrderNavigation } from '@/components/quick/QuickOrderNavigation'
import { BarChart3, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']
type Category = Database['public']['Tables']['categories']['Row']

// Error Fallback Component
function ErrorFallback({ error, retry }: { error: any; retry: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            There was an error loading the Quick Order page. This might be due to a temporary issue.
          </p>
          <div className="flex gap-2">
            <Button onClick={retry} variant="outline">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-muted-foreground cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {error?.message || String(error)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('')
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCompare, setShowCompare] = useState(false)
  const [hasError, setHasError] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const { addItem, removeItem, comparisonItems } = useComparison()

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Fetch Suppliers with error handling
  const { data: suppliers, isLoading: suppliersLoading, error: suppliersError, refetch: refetchSuppliers } = useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .order('name')
        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching suppliers:', error)
        throw error
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000
  })

  // Fetch Categories with error handling
  const { data: categories, isLoading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')
        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching categories:', error)
        throw error
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000
  })

  // Fetch Supplier Items with error handling
  const { data: items, isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = useQuery({
    queryKey: queryKeys.suppliers.items(selectedSupplierFilter, {
      search: debouncedSearchQuery,
      inStock: showInStockOnly,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      category: selectedCategory
    }),
    queryFn: async () => {
      try {
        let query = supabase
          .from('supplier_items')
          .select(`
            *,
            supplier:suppliers(name, id)
          `)
          .order('display_name')

        if (debouncedSearchQuery) {
          query = query.ilike('display_name', `%${debouncedSearchQuery}%`)
        }

        if (selectedSupplierFilter) {
          query = query.eq('supplier_id', selectedSupplierFilter)
        }

        if (showInStockOnly) {
          query = query.eq('in_stock', true)
        }

        if (priceRange[0] > 0) {
          query = query.gte('price_ex_vat', priceRange[0])
        }

        if (priceRange[1] < 100) {
          query = query.lte('price_ex_vat', priceRange[1])
        }

        if (selectedCategory) {
          query = query.eq('category_id', selectedCategory)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
      } catch (error) {
        console.error('Error fetching supplier items:', error)
        throw error
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.pow(2, attemptIndex) * 1000
  })

  const handleAddToComparison = useCallback((item: SupplierItem) => {
    addItem(item)
  }, [addItem])

  const handleRemoveFromComparison = useCallback((item: SupplierItem) => {
    removeItem(item)
  }, [removeItem])

  const handlePriceRangeChange = (value: number[]) => {
    setPriceRange([value[0], value[1]] as [number, number])
  }

  const handleItemSelect = (item: any) => {
    console.log('Item selected:', item)
  }

  const retryAll = () => {
    setHasError(false)
    refetchSuppliers()
    refetchCategories()
    refetchItems()
  }

  // Show error fallback if there's a critical error
  if (hasError || (suppliersError && categoriesError && itemsError)) {
    return <ErrorFallback error={suppliersError || categoriesError || itemsError} retry={retryAll} />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <QuickOrderNavigation />
      
      {/* Error Alerts */}
      {(suppliersError || categoriesError || itemsError) && (
        <div className="container mx-auto px-4 py-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some data failed to load. You can still use the app, but some features may be limited.
              <Button 
                variant="link" 
                className="h-auto p-0 ml-2 text-destructive underline"
                onClick={retryAll}
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Sticky Header - positioned at very top after navigation */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Quick Order</h1>
              <p className="text-muted-foreground">
                Search and order from your suppliers instantly
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <CompactOrderGuidesCTA />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompare(!showCompare)}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Compare ({comparisonItems.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content with proper spacing */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <QuickSearch 
              onItemSelect={handleItemSelect}
              placeholder="Search for products..."
            />
          </div>
          
          <Card className="w-full lg:w-80">
            <CardContent className="space-y-4">
              {/* Supplier Filter */}
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <select
                  id="supplier"
                  className="w-full mt-1 p-2 border rounded"
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  disabled={suppliersLoading || !!suppliersError}
                >
                  <option value="">All Suppliers</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
                {suppliersLoading && <p className="text-xs text-muted-foreground mt-1">Loading suppliers...</p>}
                {suppliersError && <p className="text-xs text-destructive mt-1">Failed to load suppliers</p>}
              </div>

              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full mt-1 p-2 border rounded"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={categoriesLoading || !!categoriesError}
                >
                  <option value="">All Categories</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categoriesLoading && <p className="text-xs text-muted-foreground mt-1">Loading categories...</p>}
                {categoriesError && <p className="text-xs text-destructive mt-1">Failed to load categories</p>}
              </div>

              {/* In Stock Only */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="inStock"
                  className="h-4 w-4"
                  checked={showInStockOnly}
                  onChange={(e) => setShowInStockOnly(e.target.checked)}
                />
                <Label htmlFor="inStock">In Stock Only</Label>
              </div>

              {/* Price Range */}
              <div>
                <Label>Price Range: €{priceRange[0]} - €{priceRange[1]}</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Grid */}
        {itemsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading items...</span>
          </div>
        ) : itemsError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load items</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading the product items. Please try again.
              </p>
              <Button onClick={() => refetchItems()} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <Card key={item.id}>
                <CardContent className="space-y-2">
                  <div className="text-sm font-medium">{item.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    SKU: {item.ext_sku}
                  </div>
                  <div className="text-xs">
                    Price: €{item.price_ex_vat || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.in_stock ? "default" : "secondary"}>
                      {item.in_stock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  {showCompare ? (
                    comparisonItems.find(i => i.id === item.id) ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRemoveFromComparison(item)}
                      >
                        Remove from Comparison
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddToComparison(item)}
                      >
                        Add to Comparison
                      </Button>
                    )
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No items found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or check back later for new products.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
