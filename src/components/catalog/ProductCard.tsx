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

interface ProductCardProps {
  product: CatalogItem
  showPrice?: boolean
  density?: 'comfortable' | 'compact'
  /** Whether a brand filter is active */
  brandFilter?: string | null
}

export function ProductCard({
  product,
  showPrice = true,
  density = 'comfortable',
  brandFilter,
}: ProductCardProps) {
  const { suppliers: connectedSuppliers } = useSupplierConnections()
  const { profile } = useAuth()
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const orgId = profile?.tenant_id || null
  const hasConnection = connectedSuppliers.length > 0
  const [open, setOpen] = useState(false)
  const { items, addItem, updateQuantity, removeItem } = useCart()

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

  return (
    <Card
      data-testid="product-card"
      className="h-full flex flex-col relative group"
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
            width={200}
            height={200}
            className="aspect-square w-full"
            imgClassName="rounded object-cover"
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
              <Badge
                variant="secondary"
                data-testid="supplier-count"
                className="absolute top-2 right-2 z-10 cursor-pointer flex items-center gap-1 text-[10px] px-1.5 py-0"
              >
                {brandFilter && <Tag className="h-3 w-3" />}
                {product.supplier_count ?? 0}
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
        </div>
        <h3
          className={cn(
            'font-medium line-clamp-2',
            density === 'compact' ? 'text-xs leading-tight' : 'text-sm',
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
        {quantity === 0 ? (
          <Button onClick={handleAdd} className="mt-2">
            Add
          </Button>
        ) : (
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecrease}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm w-4 text-center">{quantity}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleIncrease}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <div
        className="absolute inset-x-0 bottom-0 p-2 bg-background/80 backdrop-blur-sm flex justify-center opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity"
      >
        {quantity === 0 ? (
          <Button size="sm" onClick={handleAdd} className="gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDecrease}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[1ch] text-center">
              {quantity}
            </span>
            <Button size="sm" variant="outline" onClick={handleIncrease}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
