import React from 'react'
import { cn } from '@/lib/utils'

interface ResultItemProps {
  item: { id: string; name: string; section: string }
  query: string
  active: boolean
  onMouseEnter: () => void
  onMouseDown: () => void
}

function highlight(text: string, query: string) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-transparent font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

export function ResultItem({ item, query, active, onMouseEnter, onMouseDown }: ResultItemProps) {
  return (
    <div
      role="option"
      aria-selected={active}
      onMouseEnter={onMouseEnter}
      onMouseDown={onMouseDown}
      className={cn(
        'cursor-pointer px-3 py-2 text-sm hover:bg-muted',
        active && 'bg-muted'
      )}
    >
      {highlight(item.name, query)}
    </div>
  )
}

