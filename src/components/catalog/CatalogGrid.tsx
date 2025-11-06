import * as React from 'react'
import { motion } from 'framer-motion'
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
  mode?: 'public' | 'authenticated'
}

export function CatalogGrid({
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
      // Only animate first 12 cards with subtle reveal
      if (index < 12) {
        return (
          <motion.div
            key={p.catalog_id}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            whileInView={{ 
              opacity: 1, 
              y: 0, 
              scale: 1.0,
              transition: { 
                duration: 0.35, 
                ease: 'easeOut',
                delay: (index % 4) * 0.07 // Stagger within rows
              }
            }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <ProductCard
              product={p}
              onAdd={supplierId => onAddToCart(p, supplierId)}
              showPrice={showPrice}
              isAdding={addingId === p.catalog_id}
              mode={mode}
            />
          </motion.div>
        )
      }
      
      // No animation for cards beyond first 12
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

