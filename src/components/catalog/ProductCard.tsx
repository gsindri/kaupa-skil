import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CatalogProduct {
  catalog_id: string
  name: string
  brand?: string
  pack_size?: string
  suppliers?: string[]
  image_main?: string
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        {product.image_main && (
          <img
            src={product.image_main}
            alt={product.name}
            className="h-32 w-full rounded object-cover"
          />
        )}
        <h3 className="font-medium line-clamp-2">{product.name}</h3>
        {product.brand && (
          <p className="text-sm text-muted-foreground">{product.brand}</p>
        )}
        {product.pack_size && (
          <p className="text-sm text-muted-foreground">{product.pack_size}</p>
        )}
        <div className="flex flex-wrap gap-1 pt-1">
          {product.suppliers?.map(s => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

