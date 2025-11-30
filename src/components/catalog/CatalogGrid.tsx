import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ProductCard } from './ProductCard'

interface CatalogGridProps {
  containerRef?: React.RefObject<HTMLDivElement>
  products: any[]
  onAddToCart: (p: any, supplierId?: string) => void
  onNearEnd?: () => void
  showPrice?: boolean
  className?: string
  addingId?: string | null
  mode?: 'public' | 'authenticated'
}

export function CatalogGrid({
  containerRef,
  products,
  onAddToCart,
  onNearEnd,
  showPrice,
  className,
  addingId,
  mode = 'authenticated',
}: CatalogGridProps) {
  const renderItem = React.useCallback(
    (p: any, index: number) => {
      return (
        <ProductCard
          key={p.catalog_id}
          product={p}
          onAdd={supplierId => onAddToCart(p, supplierId)}
          showPrice={showPrice}
          isAdding={addingId === p.catalog_id}
          mode={mode}
        />
      )
    },
    [onAddToCart, showPrice, addingId, mode],
  )

  return (
    <VirtualizedGrid
      containerRef={containerRef}
      items={products}
      renderItem={renderItem}
      itemKey={item => item.catalog_id}
      minCardWidth={180}
      rowHeight={520}
      gapX={12}
      gapY={16}
      breakpoints={[
        { minWidth: 0, columns: 2, minCardWidth: 176, gapX: 12, gapY: 16 },
        { minWidth: 600, columns: 3, minCardWidth: 248, gapX: 16, gapY: 20 },
        { minWidth: 880, columns: 4, minCardWidth: 288, gapX: 24, gapY: 28 },
        { minWidth: 1300, columns: 4, minCardWidth: 328, gapX: 24, gapY: 28 },
      ]}
      onNearEnd={onNearEnd}
      className={cn(
        'catalog-grid mt-8 scroll-mt-[calc(var(--header-h,64px)+32px)]',
        className,
      )}
    />
  )
}

