import * as React from 'react'
import type { CatalogFilters } from '@/lib/catalogFilters'

export function ZeroResultsRescue({
  filters,
  suggestions,
}: {
  filters: CatalogFilters
  suggestions: Array<{ facet: string; label: string; count?: number; action: () => void }>
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border p-4 text-sm">
      <h3 className="mb-2 text-base font-medium">No matches</h3>
      <p className="mb-3 text-muted-foreground">Try relaxing one of these filters:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            className="rounded-full bg-muted px-3 py-1 hover:bg-muted/80"
            onClick={s.action}
            title="Temporarily ignore this facet"
          >
            {s.label}{s.count != null ? ` (→ ${s.count})` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}
