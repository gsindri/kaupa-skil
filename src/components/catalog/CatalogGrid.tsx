import * as React from 'react'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ProductCard } from './ProductCard'

interface CatalogGridProps {
  products: any[]
  onAddToCart: (p: any) => void
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
      <ProductCard product={p} onAdd={() => onAddToCart(p)} showPrice={showPrice} />
    ),
    [onAddToCart, showPrice],
  )

  return (
    <VirtualizedGrid
      items={products}
      renderItem={renderItem}
      minCardWidth={280}
      rowHeight={368}
      gap={24}
      onNearEnd={onNearEnd}
      className="pl-6 pr-0 py-4"
    />
  )
}

