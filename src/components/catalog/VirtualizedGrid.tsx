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
  const getGap = () => Math.max(16, Math.min(28, window.innerWidth * 0.02))
  const [rowGap, setRowGap] = useState(getGap())

  useLayoutEffect(() => {
    function measure() {
      // Measure the width of the scroll container since this div no longer
      // controls its own overflow or scrolling behaviour.
      const width = parentRef.current?.parentElement?.clientWidth || 0
      const next = Math.max(1, Math.floor(width / 250))
      setColumns(next)
      setRowGap(getGap())
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const rowCount = Math.ceil(items.length / columns)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    // Use the nearest scrollable ancestor so the layout's main
    // content column handles scrolling instead of this component.
    getScrollElement: () => parentRef.current?.parentElement ?? null,
    // Include vertical gap between rows for accurate height calculations
    estimateSize: () => itemHeight + rowGap,
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
    <div ref={parentRef} className="overflow-visible">
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
                className="grid gap-[clamp(16px,2vw,28px)]"
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

