import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

export interface VirtualizedGridProps<T> {
  items: T[]
  /** Render a single card. Receive the item and its absolute index. */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Minimum desired card width (px). Real column count will be derived. */
  minCardWidth?: number
  /** Horizontal/vertical gap between cards (px). */
  gap?: number
  /** Fixed row height (px). Keep constant to avoid jank. */
  rowHeight?: number
  /** Optional: unique key field to reduce key churn (defaults to index). */
  itemKey?: (item: T, index: number) => React.Key
  /** Called when near end to prefetch */
  onNearEnd?: () => void
  className?: string
  style?: React.CSSProperties
}

/** Measure container width and keep it reactive. */
function useContainerSize(ref: React.RefObject<HTMLElement>) {
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect
      setW(cr.width)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return { width: w }
}

/**
 * Keep the list "anchored" when column count changes.
 * Given old/new cols and current scrollTop, compute which row to scroll to.
 */
function useAnchoredGridScroll(args: {
  scrollerRef: React.RefObject<HTMLElement>
  rowHeight: number
  getCols: () => number
}) {
  const prevCols = React.useRef<number>(0)
  const prevTop = React.useRef<number>(0)

  const beforeColsChange = React.useCallback(() => {
    const node = args.scrollerRef.current
    if (!node) return
    prevTop.current = node.scrollTop
    prevCols.current = args.getCols()
  }, [args])

  const afterColsChange = React.useCallback(() => {
    const node = args.scrollerRef.current
    if (!node) return
    const oldCols = prevCols.current
    const top = prevTop.current
    if (!oldCols || top == null) return
    const oldStartRow = Math.floor(top / args.rowHeight)
    // Keep same row index; feels right for most catalog UIs.
    const newTop = oldStartRow * args.rowHeight
    node.scrollTop = newTop
  }, [args])

  return { beforeColsChange, afterColsChange }
}

export function VirtualizedGrid<T>({
  items,
  renderItem,
  minCardWidth = 260,
  gap = 16,
  rowHeight = 320,
  itemKey,
  onNearEnd,
  className,
  style,
}: VirtualizedGridProps<T>) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)

  const { width } = useContainerSize(scrollerRef)

  // Derive column count from width.
  const getCols = React.useCallback(() => {
    if (!width) return 1
    const cols = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)))
    return cols
  }, [width, gap, minCardWidth])

  // Keep anchored when cols change
  const { beforeColsChange, afterColsChange } = useAnchoredGridScroll({
    scrollerRef,
    rowHeight,
    getCols,
  })

  const colsRef = React.useRef(1)
  if (colsRef.current !== getCols()) {
    // We’re on a render where cols changed; ensure anchoring around layout.
    beforeColsChange()
    colsRef.current = getCols()
    queueMicrotask(afterColsChange)
  }
  const cols = colsRef.current

  const rowCount = Math.ceil(items.length / cols)

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
    // measure element for precise size only if you let rowHeight vary
    // measureElement: (el) => el.getBoundingClientRect().height,
  })

  // Grab the current set of virtual rows once per render so it can be
  // referenced both for rendering and in effects without re-reading the
  // virtualizer state multiple times.
  const virtualRows = rowVirtualizer.getVirtualItems()

  // Prefetch when near the end (observe the last virtual row)
  React.useEffect(() => {
    if (!onNearEnd) return
    if (!virtualRows.length) return
    const last = virtualRows[virtualRows.length - 1]
    const rowsLeft = rowCount - 1 - last.index
    if (rowsLeft < 5) {
      onNearEnd()
    }
  }, [virtualRows, rowCount, onNearEnd])

  // Grid CSS sizes
  const cardWidth = Math.floor((width - gap * (cols - 1)) / cols)
  const totalHeight = rowVirtualizer.getTotalSize()

  return (
    <div
      ref={scrollerRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'auto',
        willChange: 'transform',
        contain: 'layout paint size',
        ...style,
      }}
    >
      {/* The inner spacer sets the full height for the virtualizer */}
      <div
        ref={innerRef}
        style={{ height: totalHeight, position: 'relative' }}
      >
        {virtualRows.map(vr => {
          const startIndex = vr.index * cols
          const endIndex = Math.min(startIndex + cols, items.length)
          // Row container absolutely positioned
          return (
            <div
              key={vr.key}
              data-row={vr.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translate3d(0, ${vr.start}px, 0)`,
                height: rowHeight,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
                gap,
                paddingInline: 0,
              }}
            >
              {Array.from({ length: endIndex - startIndex }).map((_, i) => {
                const index = startIndex + i
                const item = items[index]
                return (
                  <div key={itemKey ? itemKey(item, index) : index}>
                    {renderItem(item, index)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

