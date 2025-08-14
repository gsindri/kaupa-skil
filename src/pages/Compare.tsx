
import React, { useState } from 'react'
import { CompareHeader } from '@/components/compare/CompareHeader'
import { EnhancedComparisonTable } from '@/components/compare/EnhancedComparisonTable'
import { AdvancedFilters } from '@/components/compare/AdvancedFilters'
import { ExportDialog } from '@/components/compare/ExportDialog'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthProvider'
import { useSettings } from '@/contexts/SettingsProvider'
import { Download } from 'lucide-react'

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

  const { profile } = useAuth()
  const { includeVat } = useSettings()

  // Mock data query - replace with real data
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['price-comparison', profile?.tenant_id, includeVat],
    queryFn: async () => {
      // Mock data with enhanced features
      const mockData = [
        {
          id: '1',
          itemName: 'Extra Virgin Olive Oil',
          brand: 'Bertolli',
          category: 'Food & Beverages',
          suppliers: [
            {
              id: 'supplier-1',
              name: 'Véfkaupmenn',
              sku: 'VK-OLV-001',
              packSize: '500ml bottle',
              packPrice: 1890,
              unitPriceExVat: 3780,
              unitPriceIncVat: 4688,
              unit: 'L',
              inStock: true,
              lastUpdated: '2 hours ago',
              vatCode: 'standard',
              priceHistory: [3600, 3700, 3650, 3780, 3750, 3780],
              badge: 'good' as const,
              supplierItemId: 'supplier-item-1'
            },
            {
              id: 'supplier-2',
              name: 'Heilsuhúsið',
              sku: 'HH-OLV-002',
              packSize: '500ml bottle',
              packPrice: 2150,
              unitPriceExVat: 4300,
              unitPriceIncVat: 5332,
              unit: 'L',
              inStock: true,
              lastUpdated: '4 hours ago',
              vatCode: 'standard',
              priceHistory: [4100, 4200, 4250, 4300, 4280, 4300],
              badge: 'expensive' as const,
              supplierItemId: 'supplier-item-2'
            }
          ]
        },
        {
          id: '2',
          itemName: 'Icelandic Skyr Plain',
          brand: 'KEA',
          category: 'Dairy Products',
          suppliers: [
            {
              id: 'supplier-2',
              name: 'Heilsuhúsið',
              sku: 'HH-SKYR-PLAIN',
              packSize: '1kg container',
              packPrice: 850,
              unitPriceExVat: 850,
              unitPriceIncVat: 1054,
              unit: 'kg',
              inStock: true,
              lastUpdated: '1 hour ago',
              vatCode: 'standard',
              priceHistory: [820, 830, 840, 850, 845, 850],
              badge: 'best' as const,
              supplierItemId: 'supplier-item-3'
            },
            {
              id: 'supplier-3',
              name: 'Matfuglinn',
              sku: 'MF-SKYR-001',
              packSize: '1kg container',
              packPrice: 795,
              unitPriceExVat: 795,
              unitPriceIncVat: 986,
              unit: 'kg',
              inStock: false,
              lastUpdated: '1 day ago',
              vatCode: 'standard',
              priceHistory: [780, 785, 790, 795, 790, 795],
              badge: 'good' as const,
              supplierItemId: 'supplier-item-4'
            }
          ]
        },
        {
          id: '3',
          itemName: 'Organic Carrots',
          brand: 'Nordic Fresh',
          category: 'Fresh Produce',
          suppliers: [
            {
              id: 'supplier-3',
              name: 'Matfuglinn',
              sku: 'MF-CARR-ORG',
              packSize: '1kg bag',
              packPrice: 450,
              unitPriceExVat: 450,
              unitPriceIncVat: 558,
              unit: 'kg',
              inStock: true,
              lastUpdated: '3 hours ago',
              vatCode: 'standard',
              priceHistory: [420, 440, 445, 450, 455, 450],
              badge: 'best' as const,
              supplierItemId: 'supplier-item-5'
            }
          ]
        }
      ]

      return mockData
    },
    enabled: !!profile?.tenant_id
  })

  const filteredData = React.useMemo(() => {
    if (!comparisonData) return []
    
    return comparisonData.filter(item => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || (
        item.itemName.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower) ||
        item.suppliers.some(s => 
          s.name.toLowerCase().includes(searchLower) || 
          s.sku.toLowerCase().includes(searchLower)
        )
      )

      // Category filter
      const matchesCategory = filters.categories.length === 0 || 
        filters.categories.includes(item.category)

      // Supplier filter
      const matchesSupplier = filters.suppliers.length === 0 ||
        item.suppliers.some(s => filters.suppliers.includes(s.name))

      // Price range filter (using lowest supplier price)
      const lowestPrice = Math.min(...item.suppliers.map(s => 
        includeVat ? s.unitPriceIncVat : s.unitPriceExVat
      ))
      const matchesPrice = lowestPrice >= filters.priceRange[0] && 
        lowestPrice <= filters.priceRange[1]

      // Stock filter
      const matchesStock = !filters.inStockOnly || 
        item.suppliers.some(s => s.inStock)

      return matchesSearch && matchesCategory && matchesSupplier && 
             matchesPrice && matchesStock
    }).sort((a, b) => {
      let aValue: string | number, bValue: string | number

      switch (filters.sortBy) {
        case 'name':
          aValue = a.itemName
          bValue = b.itemName
          break
        case 'price':
          aValue = Math.min(...a.suppliers.map(s => 
            includeVat ? s.unitPriceIncVat : s.unitPriceExVat
          ))
          bValue = Math.min(...b.suppliers.map(s => 
            includeVat ? s.unitPriceIncVat : s.unitPriceExVat
          ))
          break
        case 'availability':
          aValue = a.suppliers.filter(s => s.inStock).length
          bValue = b.suppliers.filter(s => s.inStock).length
          break
        default:
          aValue = a.itemName
          bValue = b.itemName
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return filters.sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return filters.sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })
  }, [comparisonData, searchTerm, filters, includeVat])

  const activeFiltersCount = React.useMemo(() => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.suppliers.length > 0) count++
    if (filters.inStockOnly) count++
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) count++
    if (filters.minDiscount > 0) count++
    return count
  }, [filters])

  const handleExport = () => {
    console.log('Exporting filtered data:', filteredData)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Price Comparison</h1>
        <p className="text-muted-foreground">
          Compare prices across your authorized suppliers with advanced filtering
        </p>
      </div>
      
      <CompareHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFiltersClick={() => {}} // Not used with new advanced filters
        activeFilters={activeFiltersCount}
      />

      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        activeFiltersCount={activeFiltersCount}
      />
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {comparisonData?.length || 0} items
        </div>
        
        <ExportDialog 
          data={filteredData}
          trigger={
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          }
        />
      </div>
      
      <EnhancedComparisonTable 
        data={filteredData}
        isLoading={isLoading}
      />
    </div>
  )
}
