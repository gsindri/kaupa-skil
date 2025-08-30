import { useState, type SyntheticEvent } from 'react'
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

  const initialImageSrc = product.image_main
    ? /^https?:\/\//i.test(product.image_main)
      ? product.image_main
      : getCachedImageUrl(product.image_main)
    : '/placeholder.svg'
  const [imageSrc, setImageSrc] = useState(initialImageSrc)

  const handleImageError = (
    e: SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    const failedSrc = e.currentTarget.src
    const cachedUrl = getCachedImageUrl(failedSrc)
    if (cachedUrl !== failedSrc) {
      console.warn('Retrying image with cached URL', failedSrc)
      setImageSrc(cachedUrl)
    } else {
      console.error('Image failed to load', failedSrc)
      setImageSrc('/placeholder.svg')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      setOpen(true)
    } else if (!hasConnection && e.key.toLowerCase() === 'c') {
      setOpen(true)
    }
  }

  return (
    <Card
      data-testid="product-card"
      tabIndex={0}
      role="button"
      onKeyDown={handleKeyDown}
      className="h-full flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
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
          className={cn(
            "aspect-square w-full",
            density === 'compact' ? 'mb-1' : 'mb-2'
          )}
          imgClassName="rounded object-cover"
          onError={handleImageError}
        />
        <h3 className={cn(
          'font-medium line-clamp-2',
          density === 'compact' ? 'text-xs leading-tight' : 'text-sm'
        )}>
          {product.name}
        </h3>
        {product.pack_size && (
          <p
            className={cn(
              'text-muted-foreground line-clamp-1',
              density === 'compact' ? 'text-xs' : 'text-sm',
            )}
          >
            {product.pack_size}
          </p>
        )}
        {product.availability && (
          <Badge 
            variant={availabilityVariant}
            className={cn(
              density === 'compact' && 'text-xs px-1 py-0'
            )}
          >
            {product.availability}
          </Badge>
        )}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Badge
              variant="secondary"
              data-testid="supplier-count"
              className={cn(
                "cursor-pointer",
                density === 'compact' && 'text-xs px-1 py-0'
              )}
            >
              {product.supplier_count ?? 0} suppliers
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
          <div className={cn(
            "text-sm font-medium",
            density === 'compact' && 'text-xs'
          )}>
            {hasConnection ? (
              product.best_price != null ? (
                <span data-testid="price-badge">
                  from {product.best_price} {product.currency ?? ''}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )
            ) : (
              <span className="text-muted-foreground">
                Connect supplier
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
