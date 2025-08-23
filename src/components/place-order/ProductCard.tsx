import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface Product {
  id: string
  name: string
  brand: string
  pack: string
  image?: string
  suppliers: string[]
}

export function ProductCard({ product }: { product: Product }) {
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
      </CardContent>
    </Card>
  )
}
