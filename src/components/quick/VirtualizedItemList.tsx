
import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { ItemCard } from './ItemCard'

interface VirtualizedItemListProps {
  items: any[]
  height: number
  itemHeight: number
  userMode: string
  includeVat: boolean
}

export function VirtualizedItemList({ items, height, itemHeight, userMode, includeVat }: VirtualizedItemListProps) {
  const Row = ({ index, style }: { index: number; style: any }) => {
    const item = items[index]
    
    return (
      <div style={style}>
        <ItemCard
          key={item.id}
          item={item}
          userMode={userMode}
          includeVat={includeVat}
        />
      </div>
    )
  }

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      overscanCount={5}
    >
      {Row}
    </List>
  )
}
