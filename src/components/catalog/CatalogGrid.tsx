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
      minCardWidth={260}
      rowHeight={320}
      gap={16}
      onNearEnd={onNearEnd}
      className="px-4 py-2"
      style={{ height: 'calc(100vh - var(--chrome-h))' }}
    />
  )
}

