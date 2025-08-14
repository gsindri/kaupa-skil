
import React, { useState } from 'react'
import { Search, Building2, Package, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

interface SupplierCard {
  id: string
  name: string
  logo?: string
  categories: string[]
  sampleProducts: {
    name: string
    indicativePrice: number
    unit: string
  }[]
  status: 'available' | 'requested' | 'connected'
  description: string
}

const mockSuppliers: SupplierCard[] = [
  {
    id: 'sup-new-1',
    name: 'Nordic Fresh',
    categories: ['Fresh Produce', 'Organic', 'Local'],
    sampleProducts: [
      { name: 'Organic Carrots', indicativePrice: 450, unit: 'kg' },
      { name: 'Icelandic Potatoes', indicativePrice: 320, unit: 'kg' },
      { name: 'Fresh Lettuce', indicativePrice: 890, unit: 'kg' }
    ],
    status: 'available',
    description: 'Premium fresh produce supplier specializing in organic and locally sourced vegetables.'
  },
  {
    id: 'sup-new-2',
    name: 'Arctic Seafood Co.',
    categories: ['Seafood', 'Frozen', 'Premium'],
    sampleProducts: [
      { name: 'Atlantic Salmon Fillet', indicativePrice: 3200, unit: 'kg' },
      { name: 'Icelandic Cod', indicativePrice: 2800, unit: 'kg' },
      { name: 'Arctic Char', indicativePrice: 3500, unit: 'kg' }
    ],
    status: 'requested',
    description: 'Sustainable seafood supplier with direct access to Iceland\'s finest catch.'
  },
  {
    id: 'sup-new-3',
    name: 'Bakery Wholesale Plus',
    categories: ['Bakery', 'Frozen', 'Desserts'],
    sampleProducts: [
      { name: 'Artisan Bread Rolls', indicativePrice: 1200, unit: 'dozen' },
      { name: 'Croissants', indicativePrice: 2200, unit: 'dozen' },
      { name: 'Danish Pastries', indicativePrice: 1800, unit: 'dozen' }
    ],
    status: 'available',
    description: 'Professional bakery supplier offering fresh and frozen baked goods.'
  }
]

export default function Discovery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [requestedSuppliers, setRequestedSuppliers] = useState<Set<string>>(new Set(['sup-new-2']))

  const requestAccess = (supplierId: string, supplierName: string) => {
    setRequestedSuppliers(prev => new Set([...prev, supplierId]))
    toast({
      title: "Access requested",
      description: `We've sent your request to ${supplierName}. You'll be notified once approved.`,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const filteredSuppliers = mockSuppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
    supplier.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'requested':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Building2 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'requested':
        return 'Access Requested'
      default:
        return 'Available'
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'connected':
        return 'default'
      case 'requested':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Discovery</h1>
        <p className="text-muted-foreground">
          Discover new suppliers and expand your procurement options
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search suppliers, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => {
          const isRequested = requestedSuppliers.has(supplier.id)
          const status = isRequested ? 'requested' : supplier.status

          return (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      {getStatusIcon(status)}
                      <Badge variant={getStatusVariant(status)}>
                        {getStatusText(status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {supplier.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {supplier.categories.map(category => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>

                {/* Sample Products */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sample Products</h4>
                  <div className="space-y-1">
                    {supplier.sampleProducts.slice(0, 3).map((product, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{product.name}</span>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">{formatPrice(product.indicativePrice)}</span>
                          <span className="text-xs text-muted-foreground">/{product.unit}</span>
                          <Badge variant="outline" className="text-xs">indicative</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  {status === 'connected' ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Connected
                    </Button>
                  ) : status === 'requested' ? (
                    <Button variant="outline" className="w-full" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      Request Pending
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => requestAccess(supplier.id, supplier.name)}
                    >
                      Request Access
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or browse all available suppliers
          </p>
        </Card>
      )}
    </div>
  )
}
