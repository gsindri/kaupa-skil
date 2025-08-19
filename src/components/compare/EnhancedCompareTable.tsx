
import React, { useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  ShoppingCart, 
  AlertTriangle,
  Package,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import PriceBadge from '@/components/ui/PriceBadge'
import VatToggle from '@/components/ui/VatToggle'
import { useSettings } from '@/contexts/SettingsProviderUtils'

interface PriceData {
  supplierId: string
  supplierName: string
  price: number
  priceIncVat: number
  unit: string
  packSize: string
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'discontinued'
  leadTime: string
  moq: number
  discount?: number
  lastUpdated: string
  priceHistory: number[]
  isPreferred: boolean
}

interface CompareItem {
  id: string
  name: string
  brand: string
  category: string
  image?: string
  description: string
  specifications: Record<string, string>
  prices: PriceData[]
  averageRating?: number
  tags: string[]
}

interface EnhancedCompareTableProps {
  items: CompareItem[]
  onAddToCart: (item: CompareItem, supplier: PriceData, quantity: number) => void
  onRemoveItem: (itemId: string) => void
}

export function EnhancedCompareTable({ items, onAddToCart, onRemoveItem }: EnhancedCompareTableProps) {
  const { includeVat } = useSettings()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [groupBy, setGroupBy] = useState<'category' | 'brand' | 'none'>('category')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'availability'>('name')

  // Group items based on selection
  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Items': items }
    }
    
    return items.reduce((groups, item) => {
      const key = groupBy === 'category' ? item.category : item.brand
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {} as Record<string, CompareItem[]>)
  }, [items, groupBy])

  // Get best price for each item
  const getBestPrice = (item: CompareItem) => {
    const availablePrices = item.prices.filter(p => p.availability !== 'out-of-stock' && p.availability !== 'discontinued')
    if (availablePrices.length === 0) return null
    
    return availablePrices.reduce((best, current) => {
      const price = includeVat ? current.priceIncVat : current.price
      const bestPrice = includeVat ? best.priceIncVat : best.price
      return price < bestPrice ? current : best
    })
  }

  const getAvailabilityIcon = (availability: PriceData['availability']) => {
    switch (availability) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'low-stock':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'out-of-stock':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'discontinued':
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriceTrend = (history: number[]) => {
    if (history.length < 2) return 'stable'
    const recent = history[history.length - 1]
    const previous = history[history.length - 2]
    if (recent > previous) return 'up'
    if (recent < previous) return 'down'
    return 'stable'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-red-500" />
      case 'down':
        return <TrendingDown className="h-3 w-3 text-green-500" />
      default:
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  const handleQuantityChange = (itemId: string, supplierId: string, value: string) => {
    const key = `${itemId}-${supplierId}`
    setQuantities(prev => ({
      ...prev,
      [key]: parseInt(value) || 1
    }))
  }

  const handleAddToCart = (item: CompareItem, supplier: PriceData) => {
    const key = `${item.id}-${supplier.supplierId}`
    const quantity = quantities[key] || 1
    onAddToCart(item, supplier, quantity)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Group by:</span>
            <select 
              value={groupBy} 
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              className="text-sm border border-input rounded px-2 py-1"
            >
              <option value="none">No grouping</option>
              <option value="category">Category</option>
              <option value="brand">Brand</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-input rounded px-2 py-1"
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="availability">Availability</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <VatToggle includeVat={includeVat} onToggle={() => {}} />
          <Badge variant="outline">
            {items.length} item{items.length !== 1 ? 's' : ''} comparing
          </Badge>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
          <Card key={groupName}>
            {groupBy !== 'none' && (
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{groupName}</CardTitle>
              </CardHeader>
            )}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[300px]">
                        Product
                      </TableHead>
                      <TableHead className="text-center">Best Price</TableHead>
                      <TableHead className="text-center">Suppliers</TableHead>
                      <TableHead className="text-center">Availability</TableHead>
                      <TableHead className="text-center">Price Trend</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupItems.map((item) => {
                      const bestPrice = getBestPrice(item)
                      const isSelected = selectedItems.has(item.id)
                      
                      return (
                        <React.Fragment key={item.id}>
                          <TableRow className={isSelected ? 'bg-primary/5' : ''}>
                            <TableCell className="sticky left-0 bg-background z-10">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    const newSelected = new Set(selectedItems)
                                    if (checked) {
                                      newSelected.add(item.id)
                                    } else {
                                      newSelected.delete(item.id)
                                    }
                                    setSelectedItems(newSelected)
                                  }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-3">
                                    {item.image && (
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                      />
                                    )}
                                    <div>
                                      <h4 className="font-medium text-sm">{item.name}</h4>
                                      <p className="text-xs text-muted-foreground">{item.brand}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                                      <div className="flex gap-1 mt-2">
                                        {item.tags.slice(0, 2).map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {bestPrice ? (
                                <div className="space-y-1">
                                  <PriceBadge type="best">
                                    {new Intl.NumberFormat('is-IS', {
                                      style: 'currency',
                                      currency: 'ISK',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }).format(includeVat ? bestPrice.priceIncVat : bestPrice.price)}
                                  </PriceBadge>
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-muted-foreground">Best</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {bestPrice.supplierName}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="destructive">Unavailable</Badge>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <span className="text-sm font-medium">
                                  {item.prices.length} supplier{item.prices.length !== 1 ? 's' : ''}
                                </span>
                                <div className="flex justify-center gap-1">
                                  {item.prices.slice(0, 3).map(price => (
                                    <div key={price.supplierId} className="flex items-center gap-1">
                                      {price.isPreferred && (
                                        <Star className="h-3 w-3 text-yellow-500" />
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {price.supplierName.substring(0, 8)}
                                        {price.supplierName.length > 8 ? '...' : ''}
                                      </span>
                                    </div>
                                  ))}
                                  {item.prices.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{item.prices.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                {bestPrice && getAvailabilityIcon(bestPrice.availability)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {bestPrice?.availability.replace('-', ' ') || 'Unknown'}
                              </p>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {bestPrice && (
                                <div className="flex flex-col items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    {getTrendIcon(getPriceTrend(bestPrice.priceHistory))}
                                    <span className="text-xs">
                                      {getPriceTrend(bestPrice.priceHistory)}
                                    </span>
                                  </div>
                                  <div className="w-16 h-8">
                                    <Sparkline 
                                      data={bestPrice.priceHistory}
                                      width={64}
                                      height={32}
                                    />
                                  </div>
                                </div>
                              )}
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onRemoveItem(item.id)}
                                >
                                  Remove
                                </Button>
                                {bestPrice && (
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      min="1"
                                      value={quantities[`${item.id}-${bestPrice.supplierId}`] || 1}
                                      onChange={(e) => handleQuantityChange(item.id, bestPrice.supplierId, e.target.value)}
                                      className="w-16 h-8 text-xs"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(item, bestPrice)}
                                      className="gap-1"
                                    >
                                      <ShoppingCart className="h-3 w-3" />
                                      Add
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded row showing all suppliers */}
                          {isSelected && (
                            <TableRow className="bg-muted/25">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 space-y-3">
                                  <h5 className="font-medium text-sm">All Supplier Options:</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {item.prices.map((price) => (
                                      <Card key={price.supplierId} className="p-3">
                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-sm">{price.supplierName}</span>
                                              {price.isPreferred && (
                                                <Star className="h-3 w-3 text-yellow-500" />
                                              )}
                                            </div>
                                            {getAvailabilityIcon(price.availability)}
                                          </div>
                                          
                                          <div className="flex items-center justify-between">
                                            <PriceBadge type={price === bestPrice ? 'best' : 'average'}>
                                              {new Intl.NumberFormat('is-IS', {
                                                style: 'currency',
                                                currency: 'ISK',
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                              }).format(includeVat ? price.priceIncVat : price.price)}
                                            </PriceBadge>
                                            {price === bestPrice && (
                                              <Badge variant="outline" className="text-xs">Best</Badge>
                                            )}
                                          </div>
                                          
                                          <div className="text-xs text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-1">
                                              <Package className="h-3 w-3" />
                                              <span>{price.packSize} • MOQ: {price.moq}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              <span>Lead time: {price.leadTime}</span>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              min="1"
                                              value={quantities[`${item.id}-${price.supplierId}`] || 1}
                                              onChange={(e) => handleQuantityChange(item.id, price.supplierId, e.target.value)}
                                              className="flex-1 h-8 text-xs"
                                            />
                                            <Button
                                              size="sm"
                                              onClick={() => handleAddToCart(item, price)}
                                              disabled={price.availability === 'out-of-stock' || price.availability === 'discontinued'}
                                              className="gap-1"
                                            >
                                              <ShoppingCart className="h-3 w-3" />
                                              Add
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
