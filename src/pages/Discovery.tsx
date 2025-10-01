
import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useSupplierSearch, useFeaturedSuppliers, useCategories } from '@/hooks/useSupplierSearch'
import { FeaturedSuppliersCarousel } from '@/components/discovery/FeaturedSuppliersCarousel'
import { CategoryChips } from '@/components/discovery/CategoryChips'
import { SupplierDiscoveryCard } from '@/components/discovery/SupplierDiscoveryCard'
import type { EnhancedSupplier } from '@/hooks/useSupplierSearch'

export default function Discovery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [requestedSuppliers, setRequestedSuppliers] = useState<Set<string>>(new Set())
  
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: featuredSuppliers = [], isLoading: featuredLoading } = useFeaturedSuppliers()
  const { data: searchResults = [], isLoading: searchLoading } = useSupplierSearch({
    query: debouncedSearch || undefined,
    categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
  })

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleRequestAccess = (supplier: EnhancedSupplier) => {
    setRequestedSuppliers((prev) => new Set([...prev, supplier.id]))
    toast({
      title: 'Access requested',
      description: `We've sent your request to ${supplier.display_name}. You'll be notified once approved.`,
    })
  }

  const handleSupplierClick = (supplier: EnhancedSupplier) => {
    // Navigate to supplier details page
    window.location.href = `/suppliers`
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Force immediate search on Enter
      setSearchTerm((e.target as HTMLInputElement).value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Discovery</h1>
        <p className="text-muted-foreground">
          Discover new suppliers and expand your procurement options
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search suppliers, products, categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="pl-10"
        />
      </div>

      {/* Category Filters */}
      <div>
        <h3 className="text-sm font-medium mb-3">Filter by Category</h3>
        <CategoryChips
          categories={categories}
          selectedIds={selectedCategories}
          onToggle={handleCategoryToggle}
          isLoading={categoriesLoading}
        />
      </div>

      {/* Featured Suppliers Carousel */}
      {!debouncedSearch && selectedCategories.length === 0 && (
        <FeaturedSuppliersCarousel
          suppliers={featuredSuppliers}
          isLoading={featuredLoading}
          onSupplierClick={handleSupplierClick}
        />
      )}

      {/* Results Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {debouncedSearch || selectedCategories.length > 0
            ? 'Search Results'
            : 'All Suppliers'}
        </h2>
        
        {searchLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-80" />
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <Card className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse all available suppliers
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((supplier) => (
              <SupplierDiscoveryCard
                key={supplier.id}
                supplier={supplier}
                onRequestAccess={
                  requestedSuppliers.has(supplier.id) ? undefined : handleRequestAccess
                }
                onViewDetails={handleSupplierClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
