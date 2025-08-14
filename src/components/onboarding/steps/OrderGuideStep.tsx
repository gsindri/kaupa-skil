
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, BookOpen, Check, Star, Tag } from 'lucide-react'

const categoryOptions = [
  { id: 'fresh-produce', name: 'Fresh Produce', icon: '🥬', description: 'Fruits, vegetables, herbs' },
  { id: 'meat-poultry', name: 'Meat & Poultry', icon: '🥩', description: 'Fresh and frozen meats' },
  { id: 'seafood', name: 'Seafood', icon: '🐟', description: 'Fresh and frozen fish' },
  { id: 'dairy', name: 'Dairy Products', icon: '🥛', description: 'Milk, cheese, yogurt' },
  { id: 'bakery', name: 'Bakery', icon: '🍞', description: 'Fresh baked goods' },
  { id: 'pantry', name: 'Pantry Staples', icon: '🥫', description: 'Dry goods, canned items' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', description: 'Drinks, juices, water' },
  { id: 'cleaning', name: 'Cleaning Supplies', icon: '🧽', description: 'Cleaning products' },
]

interface OrderGuideData {
  categories: string[]
  preferredSuppliers: string[]
}

interface OrderGuideStepProps {
  onComplete: (data: { orderGuide: OrderGuideData }) => void
  onBack: () => void
  initialData?: OrderGuideData
  organizationData?: any
}

export function OrderGuideStep({ onComplete, onBack, initialData, organizationData }: OrderGuideStepProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categories || []
  )
  const [preferredSuppliers, setPreferredSuppliers] = useState<string[]>(
    initialData?.preferredSuppliers || []
  )

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const togglePreferredSupplier = (supplierId: string) => {
    setPreferredSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleComplete = () => {
    onComplete({
      orderGuide: {
        categories: selectedCategories,
        preferredSuppliers
      }
    })
  }

  // Mock supplier data based on what was selected in previous step
  const connectedSuppliers = [
    { id: 'vefkaupmenn', name: 'Véfkaupmenn', logo: '🏪' },
    { id: 'heilsuhusid', name: 'Heilsuhúsið', logo: '🏥' },
    { id: 'nordic-fresh', name: 'Nordic Fresh', logo: '🥬' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center">
        <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Set up your order guide</h3>
        <p className="text-muted-foreground">
          Configure your ordering preferences to streamline future purchases.
        </p>
      </div>

      {/* Organization Summary */}
      {organizationData && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h5 className="font-medium">Setting up for {organizationData.name}</h5>
                <p className="text-sm text-muted-foreground">
                  Contact: {organizationData.contactName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Categories */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Product Categories You Order
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Select the categories you typically order to customize your experience.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {categoryOptions.map((category) => (
            <Card key={category.id} className={`cursor-pointer transition-all hover:shadow-sm ${
              selectedCategories.includes(category.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{category.icon}</div>
                    <div>
                      <h5 className="font-medium">{category.name}</h5>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <Checkbox
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preferred Suppliers */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Star className="h-4 w-4" />
          Preferred Suppliers
        </h4>
        <p className="text-sm text-muted-foreground mb-4">
          Mark suppliers as preferred to prioritize them in price comparisons.
        </p>
        <div className="space-y-2">
          {connectedSuppliers.map((supplier) => (
            <Card key={supplier.id} className={`cursor-pointer transition-all hover:shadow-sm ${
              preferredSuppliers.includes(supplier.id) ? 'ring-2 ring-primary' : ''
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">{supplier.logo}</div>
                    <div>
                      <h5 className="font-medium">{supplier.name}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">Connected</Badge>
                        {preferredSuppliers.includes(supplier.id) && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Preferred
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Checkbox
                    checked={preferredSuppliers.includes(supplier.id)}
                    onCheckedChange={() => togglePreferredSupplier(supplier.id)}
                  />
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
        <Button onClick={handleComplete} size="lg">
          Complete Setup
          <Check className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
