
import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { ItemCard } from './ItemCard'
import { Checkbox } from '@/components/ui/checkbox'
import { PerformanceMonitor } from '@/lib/performance'

interface PerformanceOptimizedListProps {
  items: any[]
  onCompareItem: (itemId: string) => void
  userMode: 'just-order' | 'balanced' | 'analytical'
  selectedItems?: string[]
  onItemSelect?: (itemId: string, isSelected: boolean) => void
}

export function PerformanceOptimizedList({ 
  items, 
  onCompareItem, 
  userMode,
  selectedItems = [],
  onItemSelect 
}: PerformanceOptimizedListProps) {
  // Memoize expensive calculations
  const memoizedItems = useMemo(() => {
    PerformanceMonitor.startMeasurement('items-processing')
    const processed = items.map(item => ({
      ...item,
      _cacheKey: `${item.id}-${item.name}-${userMode}`
    }))
    PerformanceMonitor.endMeasurement('items-processing')
    return processed
  }, [items, userMode])

  const ItemRow = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = memoizedItems[index]
    const isSelected = selectedItems.includes(item.id)

    return (
      <div style={style} className="px-2 py-1">
        <div className="flex items-center gap-3">
          {onItemSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onItemSelect(item.id, !!checked)}
              className="flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <ItemCard
              item={item}
              onCompareItem={onCompareItem}
              userMode={userMode}
              compact={userMode === 'just-order'}
            />
          </div>
        </div>
      </div>
    )
  })

  ItemRow.displayName = 'ItemRow'

  const itemHeight = userMode === 'just-order' ? 92 : 124
  const listHeight = Math.min(items.length * itemHeight, 600)

  return (
    <div className="w-full">
      <List
        height={listHeight}
        itemCount={memoizedItems.length}
        itemSize={itemHeight}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        overscanCount={5} // Prerender 5 items above/below viewport
      >
        {ItemRow}
      </List>
    </div>
  )
}
