import * as React from 'react'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ProductCard } from './ProductCard'

interface CatalogGridProps {
  products: any[]
  onAddToCart: (p: any, supplierId?: string) => void
  onNearEnd?: () => void
  showPrice?: boolean
}

export function CatalogGrid({
  products,
  onAddToCart,
  onNearEnd,
  showPrice,
}: CatalogGridProps) {
  const renderItem = React.useCallback(
    (p: any, _index: number) => (
      <ProductCard 
        key={p.catalog_id} 
        product={p} 
        onAdd={supplierId => onAddToCart(p, supplierId)}
        showPrice={showPrice} 
      />
    ),
    [onAddToCart, showPrice],
  )

  return (
    <VirtualizedGrid
      items={products}
      renderItem={renderItem}
      itemKey={(item) => item.catalog_id}
      minCardWidth={280}
      rowHeight={368}
      gap={24}
      onNearEnd={onNearEnd}
      className="py-4"
    />
  )
}

