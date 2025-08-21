
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useComparisonItems } from '@/hooks/useComparisonItems'
import { ComparisonItem, SupplierQuote } from '@/hooks/useComparisonItems'
import { Download, Filter } from 'lucide-react'
import { UnitConversionCalculator } from '@/components/units/UnitConversionCalculator'
import { EnhancedCompareTable } from '@/components/compare/EnhancedCompareTable'
import { ExportDialog } from '@/components/compare/ExportDialog'
import { AdvancedFilters } from '@/components/compare/AdvancedFilters'
import { useToast } from '@/hooks/use-toast'

// Transform comparison items to enhanced format
function transformToEnhancedItems(items: ComparisonItem[]) {
  return items.map(item => ({
    id: item.id,
    name: item.itemName,
    brand: item.brand || 'Unknown',
    category: item.category || 'Uncategorized',
    image: undefined,
    description: `${item.brand || 'Generic'} ${item.itemName}`,
    specifications: {},
    prices: item.suppliers.map(supplier => ({
      supplierId: supplier.id,
      supplierName: supplier.name,
      price: Math.round(supplier.unitPriceIncVat / 1.24), // Estimate ex-VAT
      priceIncVat: supplier.unitPriceIncVat,
      unit: 'piece',
      packSize: supplier.packSize,
      availability: supplier.inStock ? 'in-stock' as const : 'out-of-stock' as const,
      leadTime: '1-2 days',
      moq: 1,
      discount: 0,
      lastUpdated: new Date().toISOString(),
      priceHistory: [
        supplier.unitPriceIncVat * 1.1,
        supplier.unitPriceIncVat * 1.05,
        supplier.unitPriceIncVat
      ],
      isPreferred: false
    })),
    averageRating: 4.2,
    tags: [item.category || 'General', item.brand || 'Generic'].filter(Boolean)
  }))
}

interface FilterState {
  priceRange: [number, number]
  categories: string[]
  suppliers: string[]
  inStockOnly: boolean
  minDiscount: number
  sortBy: 'price' | 'name' | 'discount' | 'availability'
  sortOrder: 'asc' | 'desc'
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { items, isLoading, suppliers, categories } = useComparisonItems()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    categories: [],
    suppliers: [],
    inStockOnly: false,
    minDiscount: 0,
    sortBy: 'name',
    sortOrder: 'asc'
  })

  // Transform items for enhanced table
  const enhancedItems = useMemo(() => transformToEnhancedItems(items), [items])

  // Filter items based on current filters
  const filteredItems = useMemo(() => {
    let filtered = enhancedItems

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(item =>
        filters.categories.includes(item.category)
      )
    }

    if (filters.suppliers.length > 0) {
      filtered = filtered.map(item => ({
        ...item,
        prices: item.prices.filter(price =>
          filters.suppliers.includes(price.supplierName)
        )
      })).filter(item => item.prices.length > 0)
    }

    if (filters.inStockOnly) {
      filtered = filtered.map(item => ({
        ...item,
        prices: item.prices.filter(price => price.availability === 'in-stock')
      })).filter(item => item.prices.length > 0)
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) {
      filtered = filtered.map(item => ({
        ...item,
        prices: item.prices.filter(price =>
          price.priceIncVat >= filters.priceRange[0] &&
          price.priceIncVat <= filters.priceRange[1]
        )
      })).filter(item => item.prices.length > 0)
    }

    return filtered
  }, [enhancedItems, searchTerm, filters])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (filters.categories.length > 0) {
      filters.categories.forEach(cat => params.append('category', cat))
    }
    if (filters.suppliers.length > 0) {
      filters.suppliers.forEach(sup => params.append('supplier', sup))
    }
    if (filters.inStockOnly) params.set('inStock', 'true')
    if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString())
    if (filters.priceRange[1] < 10000) params.set('maxPrice', filters.priceRange[1].toString())

    setSearchParams(params)
  }, [searchTerm, filters, setSearchParams])

  const handleAddToCart = (item: any, supplier: any, quantity: number) => {
    toast({
      title: 'Added to cart',
      description: `${quantity}x ${item.name} from ${supplier.supplierName}`
    })
  }

  const handleRemoveItem = (itemId: string) => {
    toast({
      title: 'Item removed',
      description: 'Item has been removed from comparison'
    })
  }

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Preparing your comparison data...'
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.suppliers.length > 0) count++
    if (filters.inStockOnly) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++
    if (filters.minDiscount > 0) count++
    return count
  }, [filters])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading comparison data...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && items.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No items available for comparison.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Price Comparison</h1>
          <p className="text-muted-foreground">
            Compare prices across suppliers to find the best deals
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </Badge>
          <ExportDialog 
            data={filteredItems} 
            trigger={
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            }
          />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search items</Label>
          <Input
            id="search"
            type="search"
            placeholder="Search items by name or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
      </div>

      {/* Unit Conversion Calculator */}
      <UnitConversionCalculator />

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        activeFiltersCount={activeFiltersCount}
      />

      {/* Enhanced Compare Table */}
      <EnhancedCompareTable
        items={filteredItems}
        onAddToCart={handleAddToCart}
        onRemoveItem={handleRemoveItem}
      />

      {filteredItems.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No items match your current filters
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setFilters({
                  priceRange: [0, 10000],
                  categories: [],
                  suppliers: [],
                  inStockOnly: false,
                  minDiscount: 0,
                  sortBy: 'name',
                  sortOrder: 'asc'
                })
              }}
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
