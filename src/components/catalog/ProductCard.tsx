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
import { Tag } from 'lucide-react'

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
    >
      <CardContent
        className={cn(
        )}
      >
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
      </CardContent>
    </Card>
  )
}
