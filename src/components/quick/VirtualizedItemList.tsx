
import React from 'react'
import { FixedSizeList as List } from 'react-window'
import { ItemCard } from './ItemCard'
import { Checkbox } from '@/components/ui/checkbox'

interface VirtualizedItemListProps {
  items: any[]
  onCompareItem: (itemId: string) => void
  userMode: 'just-order' | 'balanced' | 'analytical'
  selectedItems?: string[]
  onItemSelect?: (itemId: string, isSelected: boolean) => void
}

export function VirtualizedItemList({ 
  items, 
  onCompareItem, 
  userMode,
  selectedItems = [],
  onItemSelect 
}: VirtualizedItemListProps) {
  const ItemRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index]
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
  }

  const itemHeight = userMode === 'just-order' ? 92 : 124 // Adjusted for checkbox
  const listHeight = Math.min(items.length * itemHeight, 600)

  return (
    <div className="w-full">
      <List
        height={listHeight}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {ItemRow}
      </List>
    </div>
  )
}
