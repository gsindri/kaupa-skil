
import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { ItemCard } from './ItemCard'
import { Checkbox } from '@/components/ui/checkbox'
import { useOptimizedSupplierItems } from '@/hooks/useOptimizedSupplierItems'

interface VirtualizedSupplierItemsListProps {
  filters?: {
    search?: string
    supplierId?: string
    inStock?: boolean
    minPrice?: number
    maxPrice?: number
    category?: string
  }
  onCompareItem: (itemId: string) => void
  userMode: 'just-order' | 'balanced' | 'analytical'
  selectedItems?: string[]
  onItemSelect?: (itemId: string, isSelected: boolean) => void
  onItemHover?: (item: any, event: React.MouseEvent) => void
  onItemLeave?: () => void
  height?: number
}

export function VirtualizedSupplierItemsList({ 
  filters = {},
  onCompareItem, 
  userMode,
  selectedItems = [],
  onItemSelect,
  onItemHover,
  onItemLeave,
  height = 600
}: VirtualizedSupplierItemsListProps) {
  const { data: items = [], isLoading, error } = useOptimizedSupplierItems(filters)

  // Memoize expensive calculations
  const memoizedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      _cacheKey: `${item.id}-${item.name}-${userMode}`
    }))
  }, [items, userMode])

  // Error handling
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Error loading items. Please try again.</p>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Empty state
  if (memoizedItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No items found matching your criteria.</p>
      </div>
    )
  }

  const ItemRow = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = memoizedItems[index]
    const isSelected = selectedItems.includes(item.id)

    return (
      <div style={style} className="px-2 py-1">
        <div 
          className="flex items-center gap-3"
          onMouseEnter={(e) => onItemHover?.(item, e)}
          onMouseLeave={() => onItemLeave?.()}
        >
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

  const itemHeight = userMode === 'just-order' ? 104 : 132
  const listHeight = Math.min(memoizedItems.length * itemHeight, height)

  return (
    <div className="w-full border rounded-lg">
      <List
        height={listHeight}
        itemCount={memoizedItems.length}
        itemSize={itemHeight}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        overscanCount={5}
      >
        {ItemRow}
      </List>
    </div>
  )
}
