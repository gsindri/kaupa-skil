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
    (p: any, index: number) => (
      <ProductCard
        key={p.catalog_id}
        product={p}
        onAdd={supplierId => onAddToCart(p, supplierId)}
        showPrice={showPrice}
        isAdding={addingId === p.catalog_id}
        className={index < 12 ? "animate-fade-in" : undefined}
        style={index < 12 ? { animationDelay: `${index * 40}ms` } : undefined}
      />
    ),
    [onAddToCart, showPrice, addingId],
  )

  return (
    <VirtualizedGrid
      items={products}
      renderItem={renderItem}
      itemKey={item => item.catalog_id}
      minCardWidth={180}
      rowHeight={520}
      gapX={12}
      gapY={16}
      breakpoints={[
        { minWidth: 0, columns: 2, minCardWidth: 176, gapX: 12, gapY: 16 },
        { minWidth: 768, columns: 3, minCardWidth: 248, gapX: 16, gapY: 20 },
        { minWidth: 1024, columns: 4, minCardWidth: 288, gapX: 24, gapY: 28 },
        { minWidth: 1440, columns: 4, minCardWidth: 328, gapX: 24, gapY: 28 },
      ]}
      onNearEnd={onNearEnd}
      className={cn(
        'catalog-grid mt-8 scroll-mt-[calc(var(--header-h,64px)+32px)]',
        className,
      )}
    />
  )
}

