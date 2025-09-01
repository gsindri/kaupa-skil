import { useRef, useState, type SyntheticEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'
import { useAuth } from '@/contexts/useAuth'
import { useCart } from '@/contexts/useBasket'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { useQuery } from '@tanstack/react-query'
import {
  fetchCatalogItemSuppliers,
  type CatalogItem,
  type CatalogSupplier,
} from '@/services/catalog'
import { LazyImage } from '@/components/ui/LazyImage'
import { getCachedImageUrl } from '@/services/ImageCache'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/lib/types'
import { useCatalogFilters } from '@/state/catalogFilters'

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
  const { items, addItem, updateQuantity, removeItem, restoreItems } = useCart()
  const { toast } = useToast()
  const orgId = profile?.tenant_id || null
  const { setFilters } = useCatalogFilters()
  const [open, setOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] =
    useState<CatalogSupplier | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const imageRef = useRef<HTMLImageElement | null>(null)

  const { data: supplierList = [] } = useQuery<CatalogSupplier[]>({
    queryKey: ['catalog-suppliers', product.catalog_id, orgId],
    queryFn: () => fetchCatalogItemSuppliers(product.catalog_id, orgId),
    enabled: open || pickerOpen,
  })

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
      setImageSrc(cachedUrl)
    } else {
      setImageSrc('/placeholder.svg')
    }
  }

  const getQtyForProduct = () => {
    const cartItem = items.find(
      item => item.supplierItemId === product.catalog_id,
    )
    return cartItem?.quantity ?? 0
  }

  const quantity = getQtyForProduct()

  const cartItem: Omit<CartItem, 'quantity'> = {
    id: product.catalog_id,
    supplierId: selectedSupplier?.supplier_id || product.suppliers[0] || '',
    supplierName: selectedSupplier?.name || product.suppliers[0] || '',
    itemName: product.name,
    sku: product.catalog_id,
    packSize: selectedSupplier?.pack_size || product.pack_size || '',
    packPrice: selectedSupplier?.price ?? product.best_price ?? 0,
    unitPriceExVat: selectedSupplier?.price ?? product.best_price ?? 0,
    unitPriceIncVat: selectedSupplier?.price ?? product.best_price ?? 0,
    vatRate: 0,
    unit: '',
    supplierItemId: product.catalog_id,
    displayName: product.name,
    packQty: 1,
    image: imageSrc,
  }

  const setQuantity = (newQty: number, supplier?: CatalogSupplier) => {
    if (newQty < 0) return
    const prevItems = items.map(i => ({ ...i }))
    const diff = newQty - quantity
    const item = supplier
      ? {
          ...cartItem,
          supplierId: supplier.supplier_id,
          supplierName: supplier.name,
          packSize: supplier.pack_size || '',
          packPrice: supplier.price ?? 0,
          unitPriceExVat: supplier.price ?? 0,
          unitPriceIncVat: supplier.price ?? 0,
        }
      : cartItem
    if (diff > 0) {
      addItem(item, diff, { animateElement: imageRef.current || undefined })
    } else if (diff < 0) {
      if (newQty === 0) {
        removeItem(product.catalog_id)
      } else {
        updateQuantity(product.catalog_id, newQty)
      }
    }
    setAnnouncement(`Quantity set to ${newQty}`)
    toast({
      description: `Added ${product.name} ×${newQty}`,
      action: (
        <ToastAction altText="Undo" onClick={() => restoreItems(prevItems)}>
          Undo
        </ToastAction>
      ),
    })
  }
  const handleAdd = () => {
    if (
      quantity === 0 &&
      !selectedSupplier &&
      (supplierList.length > 1 || product.supplier_count > 1)
    ) {
      setPickerOpen(true)
      return
    }
    setQuantity(quantity + 1)
  }
  const handleIncrease = () => setQuantity(quantity + 1)
  const handleDecrease = () => setQuantity(quantity - 1)

  const handleSupplierSelect = (supplier: CatalogSupplier) => {
    setSelectedSupplier(supplier)
    setPickerOpen(false)
    setQuantity(1, supplier)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === '+') {
      e.preventDefault()
      setQuantity(quantity + 1)
    } else if (e.key === '-') {
      e.preventDefault()
      setQuantity(quantity - 1)
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault()
      setQuantity(parseInt(e.key, 10))
    }
  }

  const priceText =
    showPrice && product.best_price != null
      ? `${product.best_price} ${product.currency ?? ''}`
      : null

  const handleFilterClick = (type: 'brand' | 'supplier', value: string) => {
    setFilters({ [type]: value })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Card
        data-testid="product-card"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="group relative rounded-xl border border-border bg-card/50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <div aria-live="polite" className="sr-only">
          {announcement}
        </div>
        <CardContent
          className={cn(
            density === 'compact' ? 'p-2 space-y-1' : 'p-4 space-y-2',
            'flex h-full flex-col',
          )}
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted/20">
            <LazyImage
              ref={imageRef}
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain"
              onError={handleImageError}
            />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <div className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-[11px] shadow ring-1 ring-border cursor-pointer">
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
                    const isConnected = connectedSuppliers.some(
                      s => s.id === supplier.supplier_id,
                    )
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
                        {!isConnected && (
                          <Button size="sm" aria-label="Connect to supplier">
                            Connect
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <h3 className="mt-3 line-clamp-1 text-sm font-medium">
            {product.name}
          </h3>
          {product.brand && (
            <button
              type="button"
              onClick={() => handleFilterClick('brand', product.brand)}
              aria-label={`Filter by Brand ${product.brand}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              {product.brand}
            </button>
          )}
          {product.pack_size && (
            <p className="text-xs text-muted-foreground">{product.pack_size}</p>
          )}
          {product.suppliers.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.suppliers.map(supplier => (
                <button
                  key={supplier}
                  type="button"
                  onClick={() => handleFilterClick('supplier', supplier)}
                  aria-label={`Filter by Supplier ${supplier}`}
                  className="text-[10px] text-muted-foreground hover:underline"
                >
                  {supplier}
                </button>
              ))}
            </div>
          )}

          <div className="mt-auto pt-3 flex items-center justify-between">
            {quantity === 0 ? (
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            ) : (
              <div className="inline-flex items-center rounded-full border bg-background">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleDecrease}
                  aria-label="Decrease"
                >
                  &minus;
                </Button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleIncrease}
                  aria-label="Increase"
                >
                  &#xFF0B;
                </Button>
              </div>
            )}
            {priceText && (
              <span className="text-xs text-muted-foreground">{priceText}</span>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="w-80 sm:w-96">
          <DialogHeader>
            <DialogTitle>Select supplier</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {supplierList.map(supplier => (
              <Button
                key={supplier.supplier_id}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleSupplierSelect(supplier)}
              >
                <span>{supplier.name}</span>
                <span className="text-xs text-muted-foreground">
                  {supplier.pack_size}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
