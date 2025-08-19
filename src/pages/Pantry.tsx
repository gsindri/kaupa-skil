import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar, 
  Search,
  Filter,
  Download,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  ShoppingCart,
  Plus
} from 'lucide-react'
import { PantryLanes } from '@/components/quick/PantryLanes'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthProvider'

interface StockItem {
  id: string
  name: string
  sku: string
  quantity: number
  unit: string
  last_ordered: string | null
  next_delivery: string | null
  price: number
  supplier: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

interface StockFilters {
  search: string
  status: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  sortBy: 'name' | 'last_ordered' | 'price'
  sortOrder: 'asc' | 'desc'
}

const initialFilters: StockFilters = {
  search: '',
  status: 'all',
  sortBy: 'name',
  sortOrder: 'asc'
}

function StockItemCard({ item }: { item: StockItem }) {
  const lastOrderedDate = item.last_ordered ? new Date(item.last_ordered) : null
  const nextDeliveryDate = item.next_delivery ? new Date(item.next_delivery) : null

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{item.name}</CardTitle>
          <Badge variant="secondary">{item.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="text-xs text-muted-foreground">
          SKU: {item.sku}
        </div>
        <div className="text-xs">
          Quantity: {item.quantity} {item.unit}
        </div>
        <div className="text-xs">
          Price: ${item.price}
        </div>
        <div className="text-xs">
          Supplier: {item.supplier}
        </div>
        {lastOrderedDate && (
          <div className="text-xs">
            Last Ordered: {lastOrderedDate.toLocaleDateString()}
          </div>
        )}
        {nextDeliveryDate && (
          <div className="text-xs">
            Next Delivery: {nextDeliveryDate.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function StockAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>3 items</strong> are out of stock.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

function StockTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Trends</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Most Popular</p>
            <p className="text-xs text-muted-foreground">Item X</p>
          </div>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Least Popular</p>
            <p className="text-xs text-muted-foreground">Item Y</p>
          </div>
          <TrendingDown className="h-5 w-5 text-red-500" />
        </div>
      </CardContent>
    </Card>
  )
}

function DeliverySchedule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <Calendar className="mr-2 inline-block h-4 w-4" /> Next delivery on <strong>July 20, 2024</strong>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Pantry() {
  const [filters, setFilters] = useState<StockFilters>(initialFilters)
  const { toast } = useToast()
  const { profile } = useAuth()

  const stockItems: StockItem[] = useMemo(() => [
    {
      id: '1',
      name: 'Milk',
      sku: 'M123',
      quantity: 10,
      unit: 'gallon',
      last_ordered: '2024-07-01',
      next_delivery: '2024-07-15',
      price: 3.50,
      supplier: 'Dairy Corp',
      status: 'in_stock'
    },
    {
      id: '2',
      name: 'Eggs',
      sku: 'E456',
      quantity: 2,
      unit: 'dozen',
      last_ordered: '2024-07-05',
      next_delivery: '2024-07-18',
      price: 2.00,
      supplier: 'Farm Fresh',
      status: 'low_stock'
    },
    {
      id: '3',
      name: 'Bread',
      sku: 'B789',
      quantity: 0,
      unit: 'loaf',
      last_ordered: '2024-06-25',
      next_delivery: '2024-07-22',
      price: 2.75,
      supplier: 'Bakery Inc',
      status: 'out_of_stock'
    },
  ], [])

  const filteredItems = useMemo(() => {
    let items = stockItems

    if (filters.search) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.status !== 'all') {
      items = items.filter(item => item.status === filters.status)
    }

    // Implement sorting
    items = [...items].sort((a, b) => {
      let comparison = 0

      if (filters.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (filters.sortBy === 'last_ordered') {
        const dateA = a.last_ordered ? new Date(a.last_ordered).getTime() : 0
        const dateB = b.last_ordered ? new Date(b.last_ordered).getTime() : 0
        comparison = dateA - dateB
      } else if (filters.sortBy === 'price') {
        comparison = a.price - b.price
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return items
  }, [stockItems, filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, search: e.target.value })
  }

  const handleStatusChange = (value: StockFilters['status']) => {
    setFilters({ ...filters, status: value })
  }

  const handleSortByChange = (value: StockFilters['sortBy']) => {
    setFilters({ ...filters, sortBy: value })
  }

  const handleSortOrderChange = (value: StockFilters['sortOrder']) => {
    setFilters({ ...filters, sortOrder: value })
  }

  return (
    <div className="container space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pantry Inventory</h1>
        <div className="space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="deliveries">Deliveries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StockAlerts />
            <StockTrends />
            <DeliverySchedule />
          </div>
          
          <PantryLanes />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search items..."
                value={filters.search}
                onChange={handleFilterChange}
                className="md:w-64"
              />
              <Select value={filters.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filters.sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="last_ordered">Last Ordered</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <StockItemCard key={item.id} item={item} />
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-3 text-center text-muted-foreground">
                No items found.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deliveries">
          <div>
            <h2 className="text-lg font-semibold">Upcoming Deliveries</h2>
            {/* Delivery Schedule Component */}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div>
            <h2 className="text-lg font-semibold">Inventory Analytics</h2>
            {/* Analytics and Reporting Components */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
