import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useComparisonItems } from '@/hooks/useComparisonItems'
import { ComparisonItem, SupplierQuote } from '@/hooks/useComparisonItems'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils'
import { CheckCheck, ChevronsUpDown } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from '@/components/ui/badge'
import { UnitConversionCalculator } from '@/components/units/UnitConversionCalculator'

interface EnhancedCompareTableProps {
  items: ComparisonItem[]
  isLoading: boolean
}

function EnhancedCompareTable({ items, isLoading }: EnhancedCompareTableProps) {
  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading items...</div>
  }

  if (!items || items.length === 0) {
    return <div className="text-center text-muted-foreground">No items to compare.</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Item</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            {items[0].suppliers.map((supplier) => (
              <TableHead key={supplier.id} className="text-right">
                {supplier.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.itemName}</TableCell>
              <TableCell>{item.brand || 'N/A'}</TableCell>
              <TableCell>{item.category || 'N/A'}</TableCell>
              {item.suppliers.map((supplier) => (
                <TableCell key={supplier.id} className="text-right">
                  <div>{supplier.packSize}</div>
                  <div>{supplier.unitPriceIncVat.toFixed(2)} ISK</div>
                  <div>
                    {supplier.inStock ? (
                      <Badge variant="outline">In Stock</Badge>
                    ) : (
                      <Badge variant="destructive">Out of Stock</Badge>
                    )}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface CompareHeaderProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

function CompareHeader({
  searchTerm,
  onSearchChange,
  onClearFilters,
  hasActiveFilters,
}: CompareHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
      <div className="flex items-center space-x-2">
        <Label htmlFor="search">Search Items:</Label>
        <Input
          type="search"
          id="search"
          placeholder="Enter item name"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {hasActiveFilters && (
        <Button variant="ghost" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  )
}

interface AdvancedFiltersProps {
  suppliers: { label: string; value: string }[]
  categories: { label: string; value: string }[]
  selectedSuppliers: string[]
  selectedCategories: string[]
  minPrice: number
  maxPrice: number
  showInStockOnly: boolean
  onSuppliersChange: (suppliers: string[]) => void
  onCategoriesChange: (categories: string[]) => void
  onMinPriceChange: (min: number) => void
  onMaxPriceChange: (max: number) => void
  onInStockToggle: (checked: boolean) => void
}

function AdvancedFilters({
  suppliers,
  categories,
  selectedSuppliers,
  selectedCategories,
  minPrice,
  maxPrice,
  showInStockOnly,
  onSuppliersChange,
  onCategoriesChange,
  onMinPriceChange,
  onMaxPriceChange,
  onInStockToggle,
}: AdvancedFiltersProps) {
  const [openSupplier, setOpenSupplier] = useState(false)
  const [openCategory, setOpenCategory] = useState(false)

  const handleSupplierSelect = (supplier: string) => {
    if (selectedSuppliers.includes(supplier)) {
      onSuppliersChange(selectedSuppliers.filter((s) => s !== supplier))
    } else {
      onSuppliersChange([...selectedSuppliers, supplier])
    }
  }

  const handleCategorySelect = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category))
    } else {
      onCategoriesChange([...selectedCategories, category])
    }
  }

  const allSuppliersSelected = useMemo(() => suppliers.every(supplier => selectedSuppliers.includes(supplier.value)), [suppliers, selectedSuppliers])
  const allCategoriesSelected = useMemo(() => categories.every(category => selectedCategories.includes(category.value)), [categories, selectedCategories])

  const toggleAllSuppliers = () => {
    if (allSuppliersSelected) {
      onSuppliersChange([])
    } else {
      onSuppliersChange(suppliers.map(supplier => supplier.value))
    }
  }

  const toggleAllCategories = () => {
    if (allCategoriesSelected) {
      onCategoriesChange([])
    } else {
      onCategoriesChange(categories.map(category => category.value))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Supplier Filter */}
        <Popover open={openSupplier} onOpenChange={setOpenSupplier}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openSupplier} className="w-full justify-between">
              Supplier <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search suppliers..." />
              <CommandList>
                <CommandItem onSelect={toggleAllSuppliers}>
                  <CheckCheck className={cn("mr-2 h-4 w-4", allSuppliersSelected ? "opacity-100" : "opacity-0")} />
                  Select All
                </CommandItem>
                <CommandSeparator />
                {suppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.value}
                    onSelect={() => handleSupplierSelect(supplier.value)}
                  >
                    <CheckCheck
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedSuppliers.includes(supplier.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {supplier.label}
                  </CommandItem>
                ))}
                <CommandEmpty>No suppliers found.</CommandEmpty>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Category Filter */}
        <Popover open={openCategory} onOpenChange={setOpenCategory}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" aria-expanded={openCategory} className="w-full justify-between">
              Category <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
              <CommandItem onSelect={toggleAllCategories}>
                  <CheckCheck className={cn("mr-2 h-4 w-4", allCategoriesSelected ? "opacity-100" : "opacity-0")} />
                  Select All
                </CommandItem>
                <CommandSeparator />
                {categories.map((category) => (
                  <CommandItem
                    key={category.value}
                    onSelect={() => handleCategorySelect(category.value)}
                  >
                    <CheckCheck
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCategories.includes(category.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.label}
                  </CommandItem>
                ))}
                <CommandEmpty>No categories found.</CommandEmpty>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <Label>Price Range (ISK)</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice > 0 ? minPrice : ''}
              onChange={(e) => onMinPriceChange(Number(e.target.value))}
              className="w-24"
            />
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice > 0 ? maxPrice : ''}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              className="w-24"
            />
          </div>
        </div>

        {/* In Stock Only Filter */}
        <div className="flex items-center space-x-2">
          <Label htmlFor="in-stock">In Stock Only</Label>
          <Switch id="in-stock" checked={showInStockOnly} onCheckedChange={onInStockToggle} />
        </div>
      </CardContent>
    </Card>
  )
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { items, isLoading, suppliers, categories } = useComparisonItems()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(
    searchParams.getAll('supplier') || []
  )
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.getAll('category') || []
  )
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 0)
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 0)
  const [showInStockOnly, setShowInStockOnly] = useState(searchParams.get('inStock') === 'true')

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    selectedSuppliers.forEach((supplier) => params.append('supplier', supplier))
    selectedCategories.forEach((category) => params.append('category', category))
    if (minPrice > 0) params.set('minPrice', minPrice.toString())
    if (maxPrice > 0) params.set('maxPrice', maxPrice.toString())
    if (showInStockOnly) params.set('inStock', 'true')

    setSearchParams(params)
  }, [
    searchTerm,
    selectedSuppliers,
    selectedCategories,
    minPrice,
    maxPrice,
    showInStockOnly,
    setSearchParams,
  ])

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedSuppliers([])
    setSelectedCategories([])
    setMinPrice(0)
    setMaxPrice(0)
    setShowInStockOnly(false)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      selectedSuppliers.length > 0 ||
      selectedCategories.length > 0 ||
      minPrice > 0 ||
      maxPrice > 0 ||
      showInStockOnly
    )
  }, [
    searchTerm,
    selectedSuppliers,
    selectedCategories,
    minPrice,
    maxPrice,
    showInStockOnly,
  ])

  const filteredItems = useMemo(() => {
    let filtered = items

    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedSuppliers.length > 0) {
      filtered = filtered.map((item) => ({
        ...item,
        suppliers: item.suppliers.filter((supplier) =>
          selectedSuppliers.includes(supplier.id)
        ),
      }))
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) =>
        item.category && selectedCategories.includes(item.category)
      )
    }

    if (minPrice > 0) {
      filtered = filtered.map((item) => ({
        ...item,
        suppliers: item.suppliers.filter((supplier) => supplier.unitPriceIncVat >= minPrice),
      }))
    }

    if (maxPrice > 0) {
      filtered = filtered.map((item) => ({
        ...item,
        suppliers: item.suppliers.filter((supplier) => supplier.unitPriceIncVat <= maxPrice),
      }))
    }

    if (showInStockOnly) {
      filtered = filtered.map((item) => ({
        ...item,
        suppliers: item.suppliers.filter((supplier) => supplier.inStock),
      }))
    }

    return filtered.filter((item) => item.suppliers.length > 0)
  }, [
    items,
    searchTerm,
    selectedSuppliers,
    selectedCategories,
    minPrice,
    maxPrice,
    showInStockOnly,
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <CompareHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Unit Conversion Calculator */}
      <UnitConversionCalculator />

      {/* Advanced Filters */}
      <AdvancedFilters
        suppliers={suppliers}
        categories={categories}
        selectedSuppliers={selectedSuppliers}
        selectedCategories={selectedCategories}
        minPrice={minPrice}
        maxPrice={maxPrice}
        showInStockOnly={showInStockOnly}
        onSuppliersChange={setSelectedSuppliers}
        onCategoriesChange={setSelectedCategories}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onInStockToggle={setShowInStockOnly}
      />

      {/* Enhanced Compare Table */}
      <EnhancedCompareTable 
        items={filteredItems}
        isLoading={isLoading}
      />
    </div>
  )
}
