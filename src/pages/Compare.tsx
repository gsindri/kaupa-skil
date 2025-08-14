
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, Plus, Trash2 } from 'lucide-react'
import { EnhancedCompareTable } from '@/components/compare/EnhancedCompareTable'
import { AdvancedFilters } from '@/components/compare/AdvancedFilters'
import { ExportDialog } from '@/components/compare/ExportDialog'
import { useToast } from '@/hooks/use-toast'

// Mock data for demonstration
const mockCompareItems = [
  {
    id: '1',
    name: 'Premium Atlantic Salmon Fillet',
    brand: 'Iceland Seafood Co.',
    category: 'Seafood',
    image: '/placeholder.svg',
    description: 'Fresh Atlantic salmon, sustainably sourced',
    specifications: {
      'Origin': 'Faroe Islands',
      'Cut': 'Fillet',
      'Grade': 'Premium'
    },
    tags: ['Fresh', 'Sustainable', 'Premium'],
    averageRating: 4.8,
    prices: [
      {
        supplierId: 'vefkaupmenn',
        supplierName: 'Véfkaupmenn',
        price: 2890,
        priceIncVat: 3584,
        unit: 'kg',
        packSize: '1kg portions',
        availability: 'in-stock' as const,
        leadTime: '1-2 days',
        moq: 5,
        discount: 10,
        lastUpdated: '2024-01-15T10:30:00Z',
        priceHistory: [3200, 3100, 3000, 2950, 2890],
        isPreferred: true
      },
      {
        supplierId: 'iceland-seafood',
        supplierName: 'Iceland Seafood',
        price: 3100,
        priceIncVat: 3844,
        unit: 'kg',
        packSize: '1.2kg portions',
        availability: 'in-stock' as const,
        leadTime: 'Same day',
        moq: 3,
        lastUpdated: '2024-01-15T09:15:00Z',
        priceHistory: [3300, 3250, 3200, 3150, 3100],
        isPreferred: false
      },
      {
        supplierId: 'nordic-fresh',
        supplierName: 'Nordic Fresh',
        price: 2750,
        priceIncVat: 3410,
        unit: 'kg',
        packSize: '800g portions',
        availability: 'low-stock' as const,
        leadTime: '2-3 days',
        moq: 10,
        lastUpdated: '2024-01-14T16:45:00Z',
        priceHistory: [2800, 2790, 2770, 2760, 2750],
        isPreferred: false
      }
    ]
  },
  {
    id: '2',
    name: 'Organic Baby Spinach',
    brand: 'Green Valley Farms',
    category: 'Fresh Produce',
    image: '/placeholder.svg',
    description: 'Fresh organic baby spinach leaves',
    specifications: {
      'Origin': 'Iceland',
      'Type': 'Baby leaves',
      'Certification': 'Organic'
    },
    tags: ['Organic', 'Local', 'Fresh'],
    averageRating: 4.6,
    prices: [
      {
        supplierId: 'vefkaupmenn',
        supplierName: 'Véfkaupmenn',
        price: 890,
        priceIncVat: 1104,
        unit: 'kg',
        packSize: '200g bags',
        availability: 'in-stock' as const,
        leadTime: '1 day',
        moq: 12,
        lastUpdated: '2024-01-15T08:20:00Z',
        priceHistory: [920, 910, 900, 895, 890],
        isPreferred: true
      },
      {
        supplierId: 'nordic-fresh',
        supplierName: 'Nordic Fresh',
        price: 850,
        priceIncVat: 1054,
        unit: 'kg',
        packSize: '150g bags',
        availability: 'in-stock' as const,
        leadTime: 'Same day',
        moq: 20,
        discount: 5,
        lastUpdated: '2024-01-15T07:30:00Z',
        priceHistory: [880, 870, 865, 855, 850],
        isPreferred: false
      }
    ]
  },
  {
    id: '3',
    name: 'Artisan Sourdough Bread',
    brand: 'Reykjavik Bakehouse',
    category: 'Bakery',
    image: '/placeholder.svg',
    description: 'Traditional sourdough bread, baked fresh daily',
    specifications: {
      'Type': 'Sourdough',
      'Weight': '800g',
      'Ingredients': 'Organic flour, water, salt, starter'
    },  
    tags: ['Artisan', 'Fresh', 'Traditional'],
    averageRating: 4.9,
    prices: [
      {
        supplierId: 'bakehouse',
        supplierName: 'Reykjavik Bakehouse',
        price: 650,
        priceIncVat: 806,
        unit: 'each',
        packSize: '800g loaves',
        availability: 'in-stock' as const,
        leadTime: 'Same day',
        moq: 6,
        lastUpdated: '2024-01-15T06:00:00Z',
        priceHistory: [650, 650, 640, 645, 650],
        isPreferred: true
      }
    ]
  }
]

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
  const [compareItems, setCompareItems] = useState(mockCompareItems)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    categories: [],
    suppliers: [],
    inStockOnly: false,
    minDiscount: 0,
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const { toast } = useToast()

  // Calculate active filters count
  const activeFiltersCount = [
    filters.categories.length > 0,
    filters.suppliers.length > 0,
    filters.inStockOnly,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 10000,
    filters.minDiscount > 0
  ].filter(Boolean).length

  const handleAddToCart = (item: any, supplier: any, quantity: number) => {
    toast({
      title: 'Added to cart',
      description: `${quantity}x ${item.name} from ${supplier.supplierName}`
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setCompareItems(prev => prev.filter(item => item.id !== itemId))
    toast({
      title: 'Item removed',
      description: 'Item removed from comparison'
    })
  }

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Preparing comparison data for export...'
    })
  }

  const handleClearAll = () => {
    setCompareItems([])
    toast({
      title: 'Comparison cleared',
      description: 'All items removed from comparison'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Price Comparison</h1>
          <p className="text-muted-foreground">
            Compare prices across suppliers to find the best deals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleClearAll} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
          <ExportDialog 
            data={compareItems}
            trigger={
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            }
          />
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Search & Filter</CardTitle>
            <Badge variant="outline">
              {compareItems.length} item{compareItems.length !== 1 ? 's' : ''} in comparison
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, brands, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Advanced Filters */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={setFilters}
            onExport={handleExport}
            activeFiltersCount={activeFiltersCount}
          />
        </CardContent>
      </Card>

      {/* Comparison Table */}
      {compareItems.length > 0 ? (
        <EnhancedCompareTable
          items={compareItems}
          onAddToCart={handleAddToCart}
          onRemoveItem={handleRemoveItem}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold">No items to compare</h3>
                <p className="text-muted-foreground">
                  Add products from your search results to start comparing prices
                </p>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Browse Products
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
