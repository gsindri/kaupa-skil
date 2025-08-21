import React from 'react'

interface RecentSearchesProps {
  items: string[]
  onSelect: (q: string) => void
}

export function RecentSearches({ items, onSelect }: RecentSearchesProps) {
  if (items.length === 0) return null
  return (
    <div className="p-2">
      <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Recent searches</div>
      {items.map((q) => (
        <button
          key={q}
          className="w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-muted"
          onMouseDown={() => onSelect(q)}
        >
          {q}
        </button>
      ))}
    </div>
  )
}

