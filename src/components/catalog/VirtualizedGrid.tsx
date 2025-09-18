import * as React from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

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
  }, [ref])
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

  const [dynamicRowHeight, setDynamicRowHeight] = React.useState(rowHeight)
  React.useEffect(() => {
    setDynamicRowHeight(rowHeight)
  }, [rowHeight])

  // Distance from the top of the document to the grid. Used so the
  // window virtualizer knows where our grid begins.
  const [scrollMargin, setScrollMargin] = React.useState(0)
  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const node = scrollerRef.current
    if (!node) return

    const updateImmediately = () => {
      const rect = node.getBoundingClientRect()
      const next = Math.round(rect.top + window.scrollY)
      if (!Number.isFinite(next)) return
      setScrollMargin(prev => (Math.abs(prev - next) > 0.5 ? next : prev))
    }

    let rafId = 0
    const scheduleUpdate = () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      rafId = window.requestAnimationFrame(() => {
        rafId = 0
        updateImmediately()
      })
    }

    updateImmediately()

    window.addEventListener('resize', scheduleUpdate)

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(node)
      if (node.parentElement) resizeObserver.observe(node.parentElement)
    }

    let lastHeaderHeight: number | null = null
    let mutationObserver: MutationObserver | undefined
    if (typeof MutationObserver !== 'undefined') {
      const docEl = document.documentElement
      const parseHeaderHeight = (value: string | null | undefined) => {
        if (!value) return null
        const trimmed = value.trim()
        if (!trimmed) return null
        const parsed = Number.parseFloat(trimmed)
        return Number.isFinite(parsed) ? parsed : null
      }
      const readInitialHeaderHeight = () => {
        const inline = parseHeaderHeight(docEl.style.getPropertyValue('--header-h'))
        if (inline != null) return inline
        const computed = parseHeaderHeight(
          getComputedStyle(docEl).getPropertyValue('--header-h')
        )
        return computed ?? 0
      }
      lastHeaderHeight = readInitialHeaderHeight()
      mutationObserver = new MutationObserver(records => {
        for (const record of records) {
          if (record.attributeName !== 'style') continue
          if (!(record.target instanceof HTMLElement)) continue
          const inline = parseHeaderHeight(
            record.target.style.getPropertyValue('--header-h')
          )
          if (inline == null) continue
          const prev = lastHeaderHeight ?? inline
          if (Math.abs(inline - prev) <= 0.5) {
            lastHeaderHeight = inline
            continue
          }
          lastHeaderHeight = inline
          scheduleUpdate()
        }
      })
      mutationObserver.observe(docEl, { attributes: true, attributeFilter: ['style'] })
    }

    return () => {
      window.removeEventListener('resize', scheduleUpdate)
      if (rafId) window.cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [width])

  // Derive column count from width.
  const getCols = React.useCallback(() => {
    if (!width) return 1
    const cols = Math.max(1, Math.floor((width + gap) / (minCardWidth + gap)))
    return cols
  }, [width, gap, minCardWidth])

  // Keep anchored when cols change
  const { beforeColsChange, afterColsChange } = useAnchoredGridScroll({
    scrollerRef,
    rowHeight: dynamicRowHeight,
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

  const rowVirtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => dynamicRowHeight,
    overscan: 3,
    scrollMargin,
    // measure element for precise size only if you let rowHeight vary
    // measureElement: (el) => el.getBoundingClientRect().height,
  })

  React.useEffect(() => {
    if (!innerRef.current) return
    const card = innerRef.current.querySelector('[data-grid-card]')
    if (!card) return
    const node = card as HTMLElement

    const measure = () => {
      const measured = node.scrollHeight
      if (!Number.isFinite(measured) || measured <= 0) return
      setDynamicRowHeight(prev => {
        const next = Math.ceil(measured + gap)
        return Math.abs(prev - next) > 1 ? next : prev
      })
    }

    const observer = new ResizeObserver(() => {
      measure()
    })

    observer.observe(node)
    measure()

    return () => observer.disconnect()
  }, [items.length, gap])

  React.useEffect(() => {
    rowVirtualizer.measure()
  }, [dynamicRowHeight, rowVirtualizer])

  const virtualRows = rowVirtualizer.getVirtualItems()

  // Debounced onNearEnd to prevent rapid-fire calls
  const [lastTriggerTime, setLastTriggerTime] = React.useState(0)
  
  // Prefetch when near the end (observe the last virtual row)
  React.useEffect(() => {
    if (!onNearEnd) return
    if (!virtualRows.length) return

    const now = Date.now()
    const debounceMs = 1000 // Only trigger once per second
    
    if (now - lastTriggerTime < debounceMs) return
    
    // For initial load, trigger onNearEnd if we have very few items
    if (items.length < 20) {
      console.log('VirtualizedGrid: Triggering onNearEnd for initial load, items:', items.length)
      setLastTriggerTime(now)
      onNearEnd()
      return
    }
    
    const last = virtualRows[virtualRows.length - 1]
    const rowsLeft = rowCount - 1 - last.index
    console.log('VirtualizedGrid: Check load more - rowsLeft:', rowsLeft, 'rowCount:', rowCount, 'lastVirtualRow:', last.index)
    // Trigger loading when we're within 3 rows of the end
    if (rowsLeft < 3) {
      console.log('VirtualizedGrid: Triggering onNearEnd for scroll')
      setLastTriggerTime(now)
      onNearEnd()
    }
  }, [virtualRows, rowCount, onNearEnd, items.length, lastTriggerTime])

  // Grid CSS sizes
  const cardWidth = Math.max(1, Math.floor((width - gap * (cols - 1)) / cols))
  const totalHeight = rowVirtualizer.getTotalSize()

  return (
    <div
      ref={scrollerRef}
      className={className}
      style={{
        position: 'relative',
        willChange: 'transform',
        minHeight: '100vh',
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
                height: dynamicRowHeight,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(${cardWidth}px, 1fr))`,
                gap,
                paddingInline: 0,
              }}
            >
              {Array.from({ length: endIndex - startIndex }).map((_, i) => {
                const index = startIndex + i
                const item = items[index]
                return (
                  <div key={itemKey ? itemKey(item, index) : index} data-grid-card>
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

