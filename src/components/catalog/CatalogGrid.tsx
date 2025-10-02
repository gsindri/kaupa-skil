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
      itemKey={item => item.catalog_id}
      minCardWidth={220}
      rowHeight={520}
      gap={12}
      breakpoints={[
        { minWidth: 0, columns: 2, minCardWidth: 180, gap: 12 },
        { minWidth: 768, columns: 3, minCardWidth: 220, gap: 16 },
        { minWidth: 1024, columns: 4, minCardWidth: 240, gap: 24 },
        { minWidth: 1440, columns: 5, minCardWidth: 260, gap: 24 },
      ]}
      onNearEnd={onNearEnd}
      className={cn('catalog-grid', className)}
    />
  )
}

