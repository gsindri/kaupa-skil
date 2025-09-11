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

  // Debug logging
  React.useEffect(() => {
    console.log('CatalogGrid products:', products.length)
  }, [products.length])

  return (
    <VirtualizedGrid
      items={products}
      renderItem={renderItem}
      minCardWidth={260}
      rowHeight={320}
      gap={16}
      onNearEnd={onNearEnd}
      className="px-4 py-2"
    />
  )
}

