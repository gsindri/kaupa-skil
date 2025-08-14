
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Filter, Download } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface FilterState {
  priceRange: [number, number]
  categories: string[]
  suppliers: string[]
  inStockOnly: boolean
  minDiscount: number
  sortBy: 'price' | 'name' | 'discount' | 'availability'
  sortOrder: 'asc' | 'desc'
}

interface AdvancedFiltersProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  onExport: () => void
  activeFiltersCount: number
}

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onExport, 
  activeFiltersCount 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const categories = [
    'Food & Beverages',
    'Dairy Products',
    'Fresh Produce',
    'Meat & Seafood',
    'Bakery Items',
    'Cleaning Supplies'
  ]

  const suppliers = [
    'Véfkaupmenn',
    'Heilsuhúsið',
    'Nordic Fresh',
    'Matfuglinn'
  ]

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      priceRange: [0, 10000],
      categories: [],
      suppliers: [],
      inStockOnly: false,
      minDiscount: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    })
  }

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'category':
        updateFilters({
          categories: filters.categories.filter(c => c !== value)
        })
        break
      case 'supplier':
        updateFilters({
          suppliers: filters.suppliers.filter(s => s !== value)
        })
        break
      case 'inStock':
        updateFilters({ inStockOnly: false })
        break
      case 'priceRange':
        updateFilters({ priceRange: [0, 10000] })
        break
      case 'discount':
        updateFilters({ minDiscount: 0 })
        break
    }
  }

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('category', category)}
              />
            </Badge>
          ))}
          
          {filters.suppliers.map(supplier => (
            <Badge key={supplier} variant="secondary" className="gap-1">
              {supplier}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('supplier', supplier)}
              />
            </Badge>
          ))}
          
          {filters.inStockOnly && (
            <Badge variant="secondary" className="gap-1">
              In Stock Only
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('inStock')}
              />
            </Badge>
          )}
          
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
            <Badge variant="secondary" className="gap-1">
              {filters.priceRange[0]} - {filters.priceRange[1]} kr
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('priceRange')}
              />
            </Badge>
          )}
          
          {filters.minDiscount > 0 && (
            <Badge variant="secondary" className="gap-1">
              Min {filters.minDiscount}% discount
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeFilter('discount')}
              />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (kr)</Label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                    max={10000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{filters.priceRange[0]} kr</span>
                    <span>{filters.priceRange[1]} kr</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={filters.categories.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({
                                categories: [...filters.categories, category]
                              })
                            } else {
                              updateFilters({
                                categories: filters.categories.filter(c => c !== category)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={category} className="text-sm">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suppliers */}
                <div className="space-y-2">
                  <Label>Suppliers</Label>
                  <div className="space-y-2">
                    {suppliers.map(supplier => (
                      <div key={supplier} className="flex items-center space-x-2">
                        <Checkbox
                          id={supplier}
                          checked={filters.suppliers.includes(supplier)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              updateFilters({
                                suppliers: [...filters.suppliers, supplier]
                              })
                            } else {
                              updateFilters({
                                suppliers: filters.suppliers.filter(s => s !== supplier)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={supplier} className="text-sm">
                          {supplier}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={filters.inStockOnly}
                    onCheckedChange={(checked) => updateFilters({ inStockOnly: !!checked })}
                  />
                  <Label htmlFor="inStock">In stock only</Label>
                </div>

                {/* Minimum Discount */}
                <div className="space-y-2">
                  <Label>Minimum Discount (%)</Label>
                  <Slider
                    value={[filters.minDiscount]}
                    onValueChange={(value) => updateFilters({ minDiscount: value[0] })}
                    max={50}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground">
                    {filters.minDiscount}% or more
                  </div>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Sort by</Label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value: FilterState['sortBy']) => updateFilters({ sortBy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="discount">Discount</SelectItem>
                        <SelectItem value="availability">Availability</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Select 
                      value={filters.sortOrder} 
                      onValueChange={(value: FilterState['sortOrder']) => updateFilters({ sortOrder: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        <Button variant="outline" onClick={onExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  )
}
