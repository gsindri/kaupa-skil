import * as React from 'react'
import { cn } from '@/lib/utils'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ProductCard } from './ProductCard'

interface CatalogGridProps {
  products: any[]
  onAddToCart: (p: any, supplierId?: string) => void
  onNearEnd?: () => void
  showPrice?: boolean
  className?: string
  addingId?: string | null
}

export function CatalogGrid({
  products,
  onAddToCart,
  onNearEnd,
  showPrice,
  className,
  addingId,
}: CatalogGridProps) {
  const renderItem = React.useCallback(
    (p: any, _index: number) => (
      <ProductCard
        key={p.catalog_id}
        product={p}
        onAdd={supplierId => onAddToCart(p, supplierId)}
        showPrice={showPrice}
        isAdding={addingId === p.catalog_id}
      />
    ),
    [onAddToCart, showPrice, addingId],
  )

  return (
    <VirtualizedGrid
      items={products}
      renderItem={renderItem}
      itemKey={(item) => item.catalog_id}
      minCardWidth={280}
      rowHeight={360}
      gap={32}
      onNearEnd={onNearEnd}
    />
  )
}

