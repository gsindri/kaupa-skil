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
import { useCart } from '@/contexts/useBasket'
import { useQuery } from '@tanstack/react-query'
import {
  fetchCatalogItemSuppliers,
  type CatalogItem,
  type CatalogSupplier,
} from '@/services/catalog'
import { LazyImage } from '@/components/ui/LazyImage'
import { getCachedImageUrl } from '@/services/ImageCache'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'
import type { CartItem } from '@/lib/types'

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
  const { items, addItem, updateQuantity, removeItem } = useCart()
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

  const priceBadge =
    showPrice && hasConnection && product.best_price != null
      ? `from ${product.best_price} ${product.currency ?? ''}`
      : null

  const getQtyForProduct = () => {
    const cartItem = items.find(
      item => item.supplierItemId === product.catalog_id,
    )
    return cartItem?.quantity ?? 0
  }

  const quantity = getQtyForProduct()

  const handleAdd = () => {
    const cartItem: Omit<CartItem, 'quantity'> = {
      id: product.catalog_id,
      supplierId: product.suppliers[0] ?? '',
      supplierName: product.suppliers[0] ?? '',
      itemName: product.name,
      sku: product.catalog_id,
      packSize: product.pack_size ?? '',
      packPrice: product.best_price ?? 0,
      unitPriceExVat: product.best_price ?? 0,
      unitPriceIncVat: product.best_price ?? 0,
      vatRate: 0,
      unit: '',
      supplierItemId: product.catalog_id,
      displayName: product.name,
      packQty: 1,
    }
    addItem(cartItem, 1)
  }

  const handleIncrease = () => {
    updateQuantity(product.catalog_id, quantity + 1)
  }

  const handleDecrease = () => {
    if (quantity - 1 <= 0) {
      removeItem(product.catalog_id)
    } else {
      updateQuantity(product.catalog_id, quantity - 1)
    }
  }

  const quantityControl =
    quantity === 0 ? (
      <Button onClick={handleAdd} className="mt-2">
        Add
      </Button>
    ) : (
      <div className="mt-2 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleDecrease}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="text-sm w-4 text-center">{quantity}</span>
        <Button size="sm" variant="outline" onClick={handleIncrease}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    )

  return (
    <Card
      data-testid="product-card"
      className="h-full flex flex-col relative group shadow-sm border border-border bg-card/50 transition hover:shadow-md hover:-translate-y-0.5"
    >
      <CardContent
        className={cn(
          density === 'compact' ? 'space-y-1 p-2' : 'space-y-2 p-4',
        )}
      >
        <div className={cn('relative', density === 'compact' ? 'mb-1' : 'mb-2')}>
          <LazyImage
            src={imageSrc}
            alt={product.name}
            loading="lazy"
            width={400}
            height={300}
            className="aspect-[4/3] w-full overflow-hidden rounded-md"
            imgClassName="object-contain"
            onError={handleImageError}
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {priceBadge && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {priceBadge}
              </Badge>
            )}
            {product.availability && (
              <Badge
                variant={availabilityVariant}
                className="text-[10px] px-1.5 py-0"
              >
                {product.availability}
              </Badge>
            )}
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <div
                data-testid="supplier-count"
                className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[11px] shadow ring-1 ring-border"
              >
                {product.supplier_count ?? 0} supplier
                {product.supplier_count !== 1 && 's'}
              </div>
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
        </div>
      </CardContent>
    </Card>
  )
}
