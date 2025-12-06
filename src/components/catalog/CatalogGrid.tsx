import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VirtualizedGrid } from './VirtualizedGrid'
import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from './ProductCardSkeleton'

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

  const fallback = (
    <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-7">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
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
      fallback={fallback}
    />
  )
}

