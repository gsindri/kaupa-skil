import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/useBasket'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

export interface Product {
  id: string
  name: string
  supplierId: string
  supplierName: string
  pack: string
  price: number
}

export function ProductCard({ product }: { product: Product }) {
  const [qty, setQty] = useState(0)
  const { addItem, removeItem } = useCart()
  const { toast } = useToast()

  const handleAdd = () => {
    if (qty <= 0) return
    addItem(
      {
        id: product.id,
        supplierId: product.supplierId,
        supplierName: product.supplierName,
        itemName: product.name,
        sku: product.id,
        packSize: product.pack,
        packPrice: product.price,
        unitPriceExVat: product.price,
        unitPriceIncVat: product.price,
        vatRate: 0.24,
        unit: 'pcs',
        supplierItemId: product.id,
        displayName: product.name,
        packQty: 1
      },
      qty,
      { showToast: false }
    )
    toast({
      title: 'Added to cart',
      action: (
        <ToastAction altText="Undo" onClick={() => removeItem(product.id)}>
          Undo
        </ToastAction>
      )
    })
    setQty(0)
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{product.name}</h3>
          <Badge>{product.supplierName}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{product.pack}</p>
        <p className="font-bold">{new Intl.NumberFormat('is-IS', { style: 'currency', currency: 'ISK' }).format(product.price)}</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => setQty(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd()
            }}
            className="w-20"
          />
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </CardContent>
    </Card>
  )
}
