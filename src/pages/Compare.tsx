
import React, { useState } from 'react'
import { CompareHeader } from '@/components/compare/CompareHeader'
import { EnhancedComparisonTable } from '@/components/compare/EnhancedComparisonTable'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/contexts/SettingsProvider'

export default function Compare() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)

  const { profile } = useAuth()
  const { includeVat } = useSettings()

  // Mock data query - replace with real data
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['price-comparison', profile?.tenant_id, includeVat],
    queryFn: async () => {
      // Mock data with price history
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
              badge: 'good' as const
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
              badge: 'expensive' as const
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
              badge: 'best' as const
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
              badge: 'good' as const
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
      const searchLower = searchTerm.toLowerCase()
      return (
        item.itemName.toLowerCase().includes(searchLower) ||
        item.brand.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.suppliers.some(s => 
          s.name.toLowerCase().includes(searchLower) || 
          s.sku.toLowerCase().includes(searchLower)
        )
      )
    })
  }, [comparisonData, searchTerm])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Price Comparison</h1>
        <p className="text-muted-foreground">
          Compare prices across your authorized suppliers
        </p>
      </div>
      
      <CompareHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFiltersClick={() => setFiltersOpen(true)}
        activeFilters={activeFilters}
      />
      
      <EnhancedComparisonTable 
        data={filteredData}
        isLoading={isLoading}
      />
    </div>
  )
}
