import React from 'react'

interface RecentSearchesProps {
  items: string[]
  onSelect: (q: string) => void
  onRemove: (q: string) => void
}

export function RecentSearches({ items, onSelect, onRemove }: RecentSearchesProps) {
  if (items.length === 0) return null
  return (
    <div className="p-2">
      <div className="px-3 py-1 text-xs font-medium text-muted-foreground">Recent searches</div>
      {items.map((q) => (
        <div key={q} className="group relative">
          <button
            type="button"
            className="w-full cursor-pointer truncate rounded-md px-3 py-2 text-left text-sm hover:bg-muted group-hover:bg-muted pr-8"
            onMouseDown={() => onSelect(q)}
          >
            {q}
          </button>
          <button
            type="button"
            aria-label={`Remove ${q} from recent searches`}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground"
            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onRemove(q)
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

