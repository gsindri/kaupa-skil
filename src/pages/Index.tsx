import React, { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from 'usehooks-ts'
import { useComparison } from '@/contexts/ComparisonContext'
import { AppLayout } from '@/layouts/AppLayout'
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
import { BarChart3 } from 'lucide-react'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']
type Category = Database['public']['Tables']['categories']['Row']

interface QuickSearchProps {
  // value: string
  // onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const QuickSearch: React.FC<QuickSearchProps> = () => {
  return (
    <Input type="search" placeholder="Search for products..." />
  )
}

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('')
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showCompare, setShowCompare] = useState(false)

  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const { addItem, removeItem, comparisonItems } = useComparison()

  // Fetch Suppliers
  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    }
  })

  // Fetch Categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    }
  })

  // Fetch Supplier Items
  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: queryKeys.suppliers.items(selectedSupplierFilter, {
      search: debouncedSearchQuery,
      inStock: showInStockOnly,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      category: selectedCategory
    }),
    queryFn: async () => {
      let query = supabase
        .from('supplier_items')
        .select(`
          *,
          supplier:suppliers(name, id)
        `)
        .order('name')

      if (debouncedSearchQuery) {
        query = query.ilike('name', `%${debouncedSearchQuery}%`)
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
      return data
    }
  })

  const handleAddToComparison = useCallback((item: SupplierItem) => {
    addItem(item)
  }, [addItem])

  const handleRemoveFromComparison = useCallback((item: SupplierItem) => {
    removeItem(item)
  }, [removeItem])

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <QuickSearch />
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
                >
                  <option value="">All Suppliers</option>
                  {suppliers?.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full mt-1 p-2 border rounded"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories?.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
                  onValueChange={setPriceRange}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Grid */}
        {itemsLoading ? (
          <div>Loading items...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items?.map(item => (
              <Card key={item.id}>
                <CardContent className="space-y-2">
                  <div className="text-sm font-medium">{item.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    SKU: {item.ext_sku}
                  </div>
                  <div className="text-xs">
                    Price: €{item.price_ex_vat}
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
        )}
      </div>
    </AppLayout>
  )
}
