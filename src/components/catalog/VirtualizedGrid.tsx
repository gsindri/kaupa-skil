import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  loadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  itemHeight?: number
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  itemHeight = 260,
}: VirtualizedGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(1)

  useLayoutEffect(() => {
    function measure() {
      const width = parentRef.current?.clientWidth || 0
      const next = Math.max(1, Math.floor(width / 250))
      setColumns(next)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const rowCount = Math.ceil(items.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    const last = virtualRows[virtualRows.length - 1]
    if (!last) return
    if (hasMore && !isLoading && last.index >= rowCount - 1) {
      loadMore?.()
    }
  }, [virtualRows, hasMore, isLoading, rowCount, loadMore])

  return (
    <div ref={parentRef} className="h-[80vh] overflow-auto">
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualRows.map(row => {
          const start = row.index * columns
          const rowItems = items.slice(start, start + columns)
          return (
            <div
              key={row.key}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${row.start}px)`, height: row.size }}
            >
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {rowItems.map((item, i) => (
                  <div key={start + i}>{renderItem(item, start + i)}</div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

