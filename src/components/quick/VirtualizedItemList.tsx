
import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { ItemCard } from './ItemCard'

interface VirtualizedItemListProps {
  items: any[]
  height: number
  itemHeight: number
  userMode: 'just-order' | 'balanced' | 'analytical'
}

export function VirtualizedItemList({ items, height, itemHeight, userMode }: VirtualizedItemListProps) {
  const handleCompareItem = (itemId: string) => {
    console.log('Compare item:', itemId)
    // TODO: Implement compare functionality
  }

  const Row = ({ index, style }: { index: number; style: any }) => {
    const item = items[index]
    
    return (
      <div style={style}>
        <ItemCard
          key={item.id}
          item={item}
          userMode={userMode}
          onCompareItem={handleCompareItem}
        />
      </div>
    )
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={5}
    >
      {Row}
    </List>
  )
}
