import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useCart } from '@/contexts/useBasket'
import { resolveImage } from '@/lib/images'

export interface Product {
  id: string
  name: string
  brand: string
  pack: string
  image?: string
  suppliers: string[]
}

function lastPurchasedOrCheapest(product: Product) {
  return product.suppliers[0]
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const [open, setOpen] = useState(false)
  const hasMultipleSuppliers = product.suppliers.length > 1
  const defaultSupplier = lastPurchasedOrCheapest(product)

  const orderedSuppliers = [
    defaultSupplier,
    ...product.suppliers.filter(s => s !== defaultSupplier),
  ]

  const handleAdd = (supplier: string) => {
    addItem(
      {
        id: product.id,
        supplierId: supplier,
        supplierName: supplier,
        itemName: product.name,
        sku: product.id,
        packSize: product.pack,
        packPrice: 0,
        unitPriceExVat: 0,
        unitPriceIncVat: 0,
        vatRate: 0,
        unit: '',
        supplierItemId: product.id,
        displayName: product.name,
        packQty: 1,
        image: resolveImage(product.image),
      },
      1,
    )
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        {product.image && (
          <img
            src={product.image}
            alt={product.name}
            className="h-32 w-full rounded object-cover"
          />
        )}
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.brand}</p>
        <p className="text-sm text-muted-foreground">{product.pack}</p>
        <div className="flex flex-wrap gap-1 pt-1">
          {product.suppliers.map(supplier => (
            <Badge key={supplier}>{supplier}</Badge>
          ))}
        </div>
        <div className="pt-2">
          {hasMultipleSuppliers ? (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button size="sm">Add</Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 flex flex-col gap-2">
                {orderedSuppliers.map(supplier => (
                  <Button
                    key={supplier}
                    variant={supplier === defaultSupplier ? 'default' : 'outline'}
                    onClick={() => {
                      handleAdd(supplier)
                      setOpen(false)
                    }}
                  >
                    {supplier} - {product.pack}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          ) : (
            <Button size="sm" onClick={() => handleAdd(defaultSupplier)}>
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
