import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { useAuth } from '@/contexts/useAuth'
import { useQuery } from '@tanstack/react-query'
import {
  fetchCatalogItemSuppliers,
  type CatalogItem,
  type CatalogSupplier,
} from '@/services/catalog'
import { LazyImage } from '@/components/ui/LazyImage'
import { getCachedImageUrl } from '@/services/ImageCache'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: CatalogItem
  showPrice?: boolean
  density?: 'comfortable' | 'compact'
}

export function ProductCard({
  product,
  showPrice = true,
  density = 'comfortable',
}: ProductCardProps) {
  const { suppliers: connectedSuppliers } = useSupplierConnections()
  const { profile } = useAuth()
  const orgId = profile?.tenant_id || null
  const hasConnection = connectedSuppliers.length > 0
  const [open, setOpen] = useState(false)

  const { data: supplierList = [] } = useQuery<CatalogSupplier[]>({
    queryKey: ['catalog-suppliers', product.catalog_id, orgId],
    queryFn: () => fetchCatalogItemSuppliers(product.catalog_id, orgId),
    enabled: open,
  })

  const connectedIds = new Set(connectedSuppliers.map(s => s.id))

  const availabilityVariant: 'secondary' | 'destructive' = product.availability
    ? product.availability.toLowerCase().includes('out')
      ? 'destructive'
      : 'secondary'
    : 'secondary'

  const imageSrc = product.image_main
    ? /^https?:\/\//i.test(product.image_main)
      ? product.image_main
      : getCachedImageUrl(product.image_main)
    : '/placeholder.svg'

  return (
    <Card data-testid="product-card" className="h-full flex flex-col">
      <CardContent
        className={cn(
          density === 'compact' ? 'space-y-1 p-2' : 'space-y-2 p-4',
        )}
      >
        <LazyImage
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          width={200}
          height={200}
          className="aspect-square w-full"
          imgClassName="rounded object-cover"
        />
        <h3 className={cn('font-medium', density === 'compact' && 'text-sm')}>
          {product.name}
        </h3>
        {product.pack_size && (
          <p
            className={cn(
              'text-sm text-muted-foreground',
              density === 'compact' && 'text-xs',
            )}
          >
            {product.pack_size}
          </p>
        )}
        {product.availability && (
          <Badge variant={availabilityVariant}>{product.availability}</Badge>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Badge
              variant="secondary"
              data-testid="supplier-count"
              className="cursor-pointer"
            >
              {product.supplier_count ?? 0} suppliers carry this
            </Badge>
          </SheetTrigger>
          <SheetContent className="w-80 sm:w-96">
            <SheetHeader>
              <SheetTitle>Suppliers</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              {supplierList.map(supplier => {
                const isConnected = connectedIds.has(supplier.supplier_id)
                return (
                  <div
                    key={supplier.supplier_id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {isConnected && supplier.price != null ? (
                        <p className="text-sm">
                          {supplier.price} {supplier.currency ?? ''}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>
                    {!isConnected && <Button size="sm">Connect</Button>}
                  </div>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
        {showPrice && (
          hasConnection ? (
            product.best_price != null ? (
              <div data-testid="price-badge" className="text-sm font-medium">
                from {product.best_price} {product.currency ?? ''}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">—</div>
            )
          ) : (
            <div className="text-sm text-muted-foreground">
              Connect supplier to see price
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
