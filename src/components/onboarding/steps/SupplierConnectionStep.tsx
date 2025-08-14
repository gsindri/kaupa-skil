import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Building2, Check, Globe, ShoppingCart } from 'lucide-react'

const availableSuppliers = [
  {
    id: 'vefkaupmenn',
    name: 'Véfkaupmenn',
    description: 'Leading food distributor in Iceland',
    categories: ['Food & Beverage', 'Fresh Produce'],
    logo: '🏪',
    featured: true
  },
  {
    id: 'heilsuhusid',
    name: 'Heilsuhúsið',
    description: 'Health and wellness products',
    categories: ['Health Products', 'Supplements'],
    logo: '🏥',
    featured: true
  },
  {
    id: 'nordic-fresh',
    name: 'Nordic Fresh',
    description: 'Premium fresh food supplier',
    categories: ['Fresh Produce', 'Organic'],
    logo: '🥬',
    featured: false
  },
  {
    id: 'iceland-seafood',
    name: 'Iceland Seafood',
    description: 'Fresh and frozen seafood',
    categories: ['Seafood', 'Frozen'],
    logo: '🐟',
    featured: false
  },
  {
    id: 'bakehouse',
    name: 'Reykjavik Bakehouse',
    description: 'Fresh baked goods and pastries',
    categories: ['Bakery', 'Fresh'],
    logo: '🍞',
    featured: false
  }
]

interface SupplierConnectionStepProps {
  onComplete: (data: { suppliers: string[] }) => void
  onBack: () => void
  initialData?: string[]
}

export function SupplierConnectionStep({ onComplete, onBack, initialData }: SupplierConnectionStepProps) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(initialData || [])

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleContinue = () => {
    onComplete({ suppliers: selectedSuppliers })
  }

  const featuredSuppliers = availableSuppliers.filter(s => s.featured)
  const otherSuppliers = availableSuppliers.filter(s => !s.featured)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Connect to your suppliers</h3>
        <p className="text-muted-foreground">
          Select the suppliers you want to connect to. You can add more later.
        </p>
      </div>

      {/* Featured Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          Popular Suppliers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featuredSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-md ${
              selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{supplier.logo}</div>
                    <div>
                      <CardTitle className="text-base">{supplier.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {supplier.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedSuppliers.includes(supplier.id)}
                    onCheckedChange={() => toggleSupplier(supplier.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {supplier.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Other Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          More Suppliers
        </h4>
        <div className="space-y-2">
          {otherSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-sm ${
              selectedSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{supplier.logo}</div>
                    <div>
                      <h5 className="font-medium">{supplier.name}</h5>
                      <p className="text-sm text-muted-foreground">{supplier.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1">
                      {supplier.categories.slice(0, 2).map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onCheckedChange={() => toggleSupplier(supplier.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {selectedSuppliers.length} supplier{selectedSuppliers.length !== 1 ? 's' : ''} selected
          </span>
          <Button onClick={handleContinue} disabled={selectedSuppliers.length === 0} size="lg">
            Continue
            <Check className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
