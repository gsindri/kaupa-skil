import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CatalogItem {
  catalog_id: string
  name: string
  brand?: string | null
  image_main?: string | null
  supplier_count?: number
  best_price?: number | null
}

export function ProductCard({ product, showPrice }: { product: CatalogItem; showPrice?: boolean }) {
  return (
    <Card data-testid="product-card">
      <CardContent className="space-y-2 p-4">
        {product.image_main && (
          <img
            src={product.image_main}
            alt={product.name}
            className="h-32 w-full rounded object-cover"
          />
        )}
        <h3 className="font-medium">{product.name}</h3>
        {product.brand && (
          <p className="text-sm text-muted-foreground">{product.brand}</p>
        )}
        <Badge variant="secondary" data-testid="supplier-count">
          {product.supplier_count ?? 0} suppliers
        </Badge>
        {showPrice && product.best_price != null && (
          <div data-testid="price-badge" className="text-sm font-medium">
            from {product.best_price} ISK
          </div>
        )}
      </CardContent>
    </Card>
  )
}
