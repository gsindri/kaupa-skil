import { useState, type SyntheticEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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

  return (
    <Card
      data-testid="product-card"
      className="group h-full flex flex-col transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <CardContent
        className={cn(
        )}
      >
        <LazyImage
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          width={200}
          height={200}
          className="w-full aspect-[4/3] rounded-t-lg bg-muted/20"
          imgClassName="object-contain"
          onError={handleImageError}
        />
        <h3
          className={cn(
            'font-medium line-clamp-1',
            density === 'compact' ? 'text-xs leading-tight' : 'text-sm'
          )}
        >
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
        <Sheet open={open} onOpenChange={setOpen}>
          <div className="flex flex-col gap-1">
            <SheetTrigger asChild>
              <Button
                variant="link"
                data-testid="supplier-count"
                className={cn(
                  'h-auto p-0 text-left font-normal',
                  density === 'compact' ? 'text-xs' : 'text-sm'
                )}
              >
                {product.supplier_count ?? 0} suppliers
              </Button>
            </SheetTrigger>
            {showPrice && (
              <div
                className={cn(
                  'flex items-center justify-between',
                  density === 'compact' ? 'text-xs' : 'text-sm'
                )}
              >
                <div className="font-medium">
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
                {!hasConnection && (
                  <SheetTrigger asChild>
                    <Button
                      size="sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Connect
                    </Button>
                  </SheetTrigger>
                )}
              </div>
            )}
          </div>
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
      </CardContent>
    </Card>
  )
}
