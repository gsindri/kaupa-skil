import React from 'react'
import type { FacetFilters } from '@/services/catalog'

interface ActiveFilterChipsProps {
  filters: FacetFilters
  onClear: (key: keyof FacetFilters) => void
}

export function ActiveFilterChips({ filters, onClear }: ActiveFilterChipsProps) {
  const active = Object.entries(filters).filter(([, v]) => Boolean(v))
  if (active.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {active.map(([k, v]) => (
        <button
          key={k}
          type="button"
          onClick={() => onClear(k as keyof FacetFilters)}
          className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
        >
          {String(v)}
          <span className="text-muted-foreground">×</span>
        </button>
      ))}
    </div>
  )
}

export default ActiveFilterChips
