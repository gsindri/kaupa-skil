import * as React from 'react'
import { useWindowVirtualizer } from '@tanstack/react-virtual'

export interface GridBreakpoint {
  minWidth: number
  columns: number
  minCardWidth?: number
  gap?: number
  gapX?: number
  gapY?: number
}

export interface VirtualizedGridProps<T> {
  containerRef?: React.RefObject<HTMLDivElement>
  items: T[]
  /** Render a single card. Receive the item and its absolute index. */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Minimum desired card width (px). Real column count will be derived. */
  minCardWidth?: number
  /** Horizontal/vertical gap between cards (px). */
  gap?: number
  /** Horizontal gap between cards (px). */
  gapX?: number
  /** Vertical gap between cards (px). */
  gapY?: number
  /** Fixed card height (px). Vertical gap is added automatically. */
  rowHeight?: number
  /** Optional: unique key field to reduce key churn (defaults to index). */
  itemKey?: (item: T, index: number) => React.Key
  /** Called when near end to prefetch */
  onNearEnd?: () => void
  className?: string
  style?: React.CSSProperties
  breakpoints?: GridBreakpoint[]
}

/** Get content width excluding padding */
function contentWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el)
  const padLeft = parseFloat(cs.paddingLeft) || 0
  const padRight = parseFloat(cs.paddingRight) || 0
  return Math.max(0, el.clientWidth - padLeft - padRight)
}

/** Measure container width and keep it reactive. */
function useContainerSize(ref: React.RefObject<HTMLElement>) {
  const [w, setW] = React.useState(0)
  
  // Force initial measurement after layout to ensure CSS variables are resolved
  React.useLayoutEffect(() => {
    if (!ref.current) return
    const measure = () => {
      if (!ref.current) return
      const width = contentWidth(ref.current)
      setW(width)
    }
    
    measure() // Immediate
    requestAnimationFrame(measure) // After paint
    
    // Retry after a small delay if we got 0 padding (CSS vars not resolved yet)
    const timer = setTimeout(() => {
      if (ref.current) {
        const cs = getComputedStyle(ref.current)
        const pad = parseFloat(cs.paddingLeft) || 0
        if (pad === 0) {
          // CSS vars still not resolved, force remeasure
          measure()
        }
      }
    }, 50)
    
    return () => clearTimeout(timer)
  }, [ref])
  
  React.useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(() => {
      setW(ref.current ? contentWidth(ref.current) : 0)
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
  containerRef,
  items,
  renderItem,
  minCardWidth = 260,
  gap = 16,
  gapX,
  gapY,
  rowHeight = 320,
  itemKey,
  onNearEnd,
  className,
  style,
  breakpoints,
}: VirtualizedGridProps<T>) {
  const scrollerRef = React.useRef<HTMLDivElement>(null)
  const innerRef = React.useRef<HTMLDivElement>(null)

  // Use external ref if provided, otherwise use internal ref
  const measureRef = containerRef || scrollerRef
  const { width } = useContainerSize(measureRef)

  // DEBUG: Log measured width
  React.useEffect(() => {
    if (width > 0) {
      console.log('🔍 VirtualizedGrid measured width:', width)
      console.log('🔍 Window width:', typeof window !== 'undefined' ? window.innerWidth : 0)
    }
  }, [width])

  const sortedBreakpoints = React.useMemo(() => {
    if (!breakpoints || breakpoints.length === 0) return null
    return [...breakpoints].sort((a, b) => a.minWidth - b.minWidth)
  }, [breakpoints])

  const baseGapX = Math.max(0, gapX ?? gap)
  const baseGapY = Math.max(0, gapY ?? gap)

  const layout = React.useMemo(() => {
    if (!sortedBreakpoints || sortedBreakpoints.length === 0) {
      return {
        gapX: baseGapX,
        gapY: baseGapY,
        minCardWidth,
        columns: undefined as number | undefined,
      }
    }

    let active = sortedBreakpoints[0]
    for (const candidate of sortedBreakpoints) {
      if (width >= candidate.minWidth) {
        active = candidate
      }
    }

    return {
      gapX: active.gapX ?? active.gap ?? baseGapX,
      gapY: active.gapY ?? active.gap ?? baseGapY,
      minCardWidth: active.minCardWidth ?? minCardWidth,
      columns: active.columns,
    }
  }, [sortedBreakpoints, width, baseGapX, baseGapY, minCardWidth])

  const safeGapX = Math.max(0, layout.gapX ?? baseGapX)
  const safeGapY = Math.max(0, layout.gapY ?? baseGapY)
  const effectiveMinCardWidth = Math.max(0, layout.minCardWidth ?? minCardWidth)
  const explicitColumns = layout.columns && layout.columns > 0 ? layout.columns : undefined

  const cardHeight = Math.max(0, rowHeight)
  const rowStride = Math.max(1, cardHeight + safeGapY)

  // Use consistent fixed row height - no dynamic measurement

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
    if (explicitColumns) return explicitColumns
    if (!width) return 1
    const cols = Math.max(
      1,
      Math.floor((width + safeGapX) / (effectiveMinCardWidth + safeGapX)),
    )
    return cols
  }, [explicitColumns, width, safeGapX, effectiveMinCardWidth])

  // Keep anchored when cols change
  const { beforeColsChange, afterColsChange } = useAnchoredGridScroll({
    scrollerRef,
    rowHeight: rowStride,
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
    estimateSize: () => rowStride,
    overscan: 3,
    scrollMargin,
  })

  React.useEffect(() => {
    rowVirtualizer.measure()
  }, [rowVirtualizer, rowStride])

  // Remove dynamic height measurement - use fixed height consistently

  const virtualRows = rowVirtualizer.getVirtualItems()

  // Debounced onNearEnd to prevent rapid-fire calls
  const lastTriggerRef = React.useRef(0)
  const hasTriggeredInitialRef = React.useRef(false)
  const previousLengthRef = React.useRef(items.length)

  React.useEffect(() => {
    const prev = previousLengthRef.current
    if (items.length < prev) {
      lastTriggerRef.current = 0
      hasTriggeredInitialRef.current = false
    }
    previousLengthRef.current = items.length
  }, [items.length])
  
  // Prefetch when near the end (observe the last virtual row)
  React.useEffect(() => {
    if (!onNearEnd) return
    if (typeof window === 'undefined') return
    if (!virtualRows.length) return

    const now = Date.now()
    const debounceMs = 500 // Minimum time between triggers

    if (now - lastTriggerRef.current < debounceMs) return
    
    // For initial load, trigger onNearEnd if we have very few items and enough space (only once)
    const totalScreens = Math.ceil(
      rowCount / Math.max(1, Math.floor(window.innerHeight / rowStride)),
    )

    if (items.length > 0 && totalScreens <= 2 && !hasTriggeredInitialRef.current) {
      hasTriggeredInitialRef.current = true
      lastTriggerRef.current = now
      onNearEnd()
      return
    }
    
    // Mark initial as triggered if we have enough content
    if (totalScreens > 2) {
      hasTriggeredInitialRef.current = true
    }
    
    const last = virtualRows[virtualRows.length - 1]
    if (!last) return

    const rowsLeft = rowCount - 1 - last.index

    // Trigger loading when we're within 3 rows of the end
    if (rowsLeft <= 3) {
      lastTriggerRef.current = now
      onNearEnd()
    }
  }, [virtualRows, rowCount, onNearEnd, items.length, rowStride])

  // Grid CSS sizes
  const cardWidth = cols
    ? Math.max(1, Math.floor((width - safeGapX * (cols - 1)) / cols))
    : effectiveMinCardWidth || 1
  const totalHeight = rowVirtualizer.getTotalSize()
  const normalizedScrollMargin = Number.isFinite(scrollMargin)
    ? scrollMargin
    : 0
  const contentHeight = Math.max(0, totalHeight)

  return (
    <div
      ref={scrollerRef}
      className={className}
      style={{
        position: 'relative',
        willChange: 'transform',
        ...style,
      }}
    >
      {/* The inner spacer sets the full height for the virtualizer */}
      <div
        ref={innerRef}
        style={{ height: contentHeight, position: 'relative' }}
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
                transform: `translate3d(0, ${Math.max(0, vr.start - normalizedScrollMargin)}px, 0)`,
                height: cardHeight,
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, ${cardWidth}px)`,
                justifyContent: 'start',
                columnGap: safeGapX,
                rowGap: safeGapY,
                paddingInline: 0,
                paddingBottom: safeGapY,
                alignContent: 'start',
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

