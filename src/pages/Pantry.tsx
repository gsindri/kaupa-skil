import React, { useState, useEffect } from 'react'
import { AppLayout } from '@/layouts/AppLayout'
import { QuickSearch } from '@/components/QuickSearch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  ChevronsUpDown,
  Grip,
  List,
  ArrowDown,
  ArrowUp,
  Package2,
  ShoppingCart,
  Plus,
  Minus,
  LucideIcon
} from 'lucide-react'
import { useEnhancedSupplierItems } from '@/hooks/useEnhancedSupplierItems'
import { useSuppliers } from '@/hooks/useSuppliers'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface Item {
  id: string
  name: string
  price: number
  supplier: string
  inStock: boolean
  imageUrl: string
}

interface SortOption {
  value: 'name' | 'price' | 'supplier'
  label: string
  icon: LucideIcon
}

const sortOptions: SortOption[] = [
  { value: 'name', label: 'Name', icon: Package2 },
  { value: 'price', label: 'Price', icon: ShoppingCart },
  { value: 'supplier', label: 'Supplier', icon: ChevronsUpDown }
]

export default function Pantry() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'supplier'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { suppliers, isLoading: isLoadingSuppliers } = useSuppliers()
  const { data: items, isLoading, isError } = useEnhancedSupplierItems({
    search: searchQuery,
    supplierId: selectedSupplier,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    category: selectedCategory,
    inStock: showInStockOnly
  })
  const { toast } = useToast()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value)
  }

  const handlePriceChange = (value: number[]) => {
    setPriceRange([value[0], value[1]])
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value)
  }

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowInStockOnly(e.target.checked)
  }

  const handleSortChange = (value: 'name' | 'price' | 'supplier') => {
    setSortBy(value)
  }

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
  }

  const getSortedItems = (items: any[]) => {
    if (!items) return []

    const sortedItems = [...items]

    sortedItems.sort((a: any, b: any) => {
      let comparison = 0

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'price') {
        comparison = a.price - b.price
      } else if (sortBy === 'supplier') {
        comparison = a.supplier.localeCompare(b.supplier)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return sortedItems
  }

  const sortedItems = getSortedItems(items || [])

  const addToOrder = (item: any) => {
    toast({
      title: 'Added to order',
      description: `${item.name} added to your current order`,
      action: <ToastAction altText="Goto order">Go to order</ToastAction>
    })
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pantry Lanes</h1>
            <p className="text-muted-foreground">
              Organize your frequent purchases into virtual aisles
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Configure Lanes
            </Button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <QuickSearch />
          </div>
          
          <div className="flex items-center gap-2">
            <Select onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <option.icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={handleSortOrderChange}>
              {sortOrder === 'asc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => handleViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grip className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Supplier Filter */}
          <Card>
            <CardContent className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Select onValueChange={handleSupplierChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Suppliers</SelectItem>
                  {isLoadingSuppliers ? (
                    <SelectItem value="" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Price Range Filter */}
          <Card>
            <CardContent className="space-y-2">
              <Label htmlFor="price">Price Range (€)</Label>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{priceRange[0]}</span>
                <span>{priceRange[1]}</span>
              </div>
              <Slider
                defaultValue={priceRange}
                max={100}
                step={1}
                onValueChange={handlePriceChange}
              />
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card>
            <CardContent className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input type="text" id="category" onChange={handleCategoryChange} />
            </CardContent>
          </Card>

          {/* In Stock Filter */}
          <Card>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="inStock"
                  className="h-4 w-4"
                  onChange={handleInStockChange}
                />
                <Label htmlFor="inStock">In Stock Only</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Item List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col gap-3">
                  <Skeleton className="h-32 w-full rounded-md" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-red-500">Error loading items.</div>
        ) : sortedItems.length === 0 ? (
          <div className="text-muted-foreground text-center py-4">No items found.</div>
        ) : (
          <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', {
              'list-mode': viewMode === 'list'
            })}
          >
            {sortedItems.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-3">
                  <div className="aspect-w-4 aspect-h-3">
                    <img
                      src="https://placehold.co/600x400"
                      alt={item.name}
                      className="object-cover rounded-md"
                    />
                  </div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <div className="text-sm text-muted-foreground">Supplier: {item.supplier?.name}</div>
                  <div className="text-xl font-bold">€{item.price}</div>
                  <Button onClick={() => addToOrder(item)}>Add to Order</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
