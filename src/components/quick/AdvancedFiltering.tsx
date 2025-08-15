
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, X, ChevronDown } from 'lucide-react';

interface FilterOptions {
  categories: string[];
  suppliers: string[];
  priceRange: [number, number];
  inStockOnly: boolean;
  sortBy: 'name' | 'price' | 'brand';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFilteringProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableCategories: string[];
  availableSuppliers: string[];
}

export function AdvancedFiltering({ 
  filters, 
  onFiltersChange, 
  availableCategories, 
  availableSuppliers 
}: AdvancedFilteringProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      suppliers: [],
      priceRange: [0, 10000],
      inStockOnly: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const activeFiltersCount = 
    filters.categories.length + 
    filters.suppliers.length + 
    (filters.inStockOnly ? 1 : 0) + 
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ? 1 : 0);

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'category':
        updateFilters({ categories: filters.categories.filter(c => c !== value) });
        break;
      case 'supplier':
        updateFilters({ suppliers: filters.suppliers.filter(s => s !== value) });
        break;
      case 'inStock':
        updateFilters({ inStockOnly: false });
        break;
      case 'priceRange':
        updateFilters({ priceRange: [0, 10000] });
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Filters:</span>
          
          {filters.categories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('category', category)} />
            </Badge>
          ))}
          
          {filters.suppliers.map(supplier => (
            <Badge key={supplier} variant="secondary" className="gap-1">
              {supplier}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('supplier', supplier)} />
            </Badge>
          ))}
          
          {filters.inStockOnly && (
            <Badge variant="secondary" className="gap-1">
              In Stock Only
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('inStock')} />
            </Badge>
          )}
          
          {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
            <Badge variant="secondary" className="gap-1">
              {filters.priceRange[0]} - {filters.priceRange[1]} kr
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('priceRange')} />
            </Badge>
          )}
          
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        {/* Advanced Filters */}
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
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="font-medium">Advanced Filters</div>
              
              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Price Range (kr)</label>
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
                <label className="text-sm font-medium">Categories</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {availableCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={filters.categories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({ categories: [...filters.categories, category] });
                          } else {
                            updateFilters({ categories: filters.categories.filter(c => c !== category) });
                          }
                        }}
                      />
                      <label htmlFor={category} className="text-sm">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suppliers */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Suppliers</label>
                <div className="space-y-2">
                  {availableSuppliers.map(supplier => (
                    <div key={supplier} className="flex items-center space-x-2">
                      <Checkbox
                        id={supplier}
                        checked={filters.suppliers.includes(supplier)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({ suppliers: [...filters.suppliers, supplier] });
                          } else {
                            updateFilters({ suppliers: filters.suppliers.filter(s => s !== supplier) });
                          }
                        }}
                      />
                      <label htmlFor={supplier} className="text-sm">
                        {supplier}
                      </label>
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
                <label htmlFor="inStock" className="text-sm">In stock only</label>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort Options */}
        <Select value={filters.sortBy} onValueChange={(value: FilterOptions['sortBy']) => updateFilters({ sortBy: value })}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="brand">Brand</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.sortOrder} onValueChange={(value: FilterOptions['sortOrder']) => updateFilters({ sortOrder: value })}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">↑</SelectItem>
            <SelectItem value="desc">↓</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
