import { useEffect, useRef, useState } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { ProductCard } from './ProductCard'
import { Checkbox } from '@/components/ui/checkbox'

interface CatalogGridProps {
  products: any[]
  selected: string[]
  onSelect: (id: string) => void
  showPrice?: boolean
}

export function CatalogGrid({ products, selected, onSelect, showPrice }: CatalogGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => setWidth(containerRef.current?.clientWidth || 0)
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const columnWidth = 300
  const rowHeight = 340
  const columnCount = Math.max(1, Math.floor(width / columnWidth))
  const rowCount = Math.ceil(products.length / columnCount)

  return (
    <div ref={containerRef} className="w-full h-[800px]">
      {width > 0 && (
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={800}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={width}
          className="scrollbar-thin"
        >
          {({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * columnCount + columnIndex
            if (index >= products.length) return null
            const product = products[index]
            const id = product.catalog_id
            const isSelected = selected.includes(id)
            return (
              <div style={style} className="p-2">
                <div className="relative">
                  <ProductCard product={product} showPrice={showPrice} />
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onSelect(id)}
                    className="absolute top-2 left-2"
                  />
                </div>
              </div>
            )
          }}
        </Grid>
      )}
    </div>
  )
}

