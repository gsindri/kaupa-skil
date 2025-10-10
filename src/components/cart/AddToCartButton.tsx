import { UnifiedCartControl } from './UnifiedCartControl'
import type { CatalogAddToCartSupplier } from '@/components/catalog/CatalogAddToCartButton'

interface AddToCartButtonProps {
  product: any
  vendors: { id: string; name: string }[]
}

/**
 * Legacy AddToCartButton - now wraps UnifiedCartControl for consistency.
 * Uses compact variant for backward compatibility with existing layouts.
 */
export default function AddToCartButton({ product, vendors }: AddToCartButtonProps) {
  const suppliers: CatalogAddToCartSupplier[] = vendors.map(v => ({
    supplier_id: v.id,
    supplier_name: v.name,
    supplier_logo_url: null,
  }))

  return (
    <UnifiedCartControl
      variant="compact"
      product={product}
      suppliers={suppliers}
      popoverSide="bottom"
      popoverAlign="start"
    />
  )
}

