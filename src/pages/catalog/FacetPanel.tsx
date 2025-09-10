import * as React from 'react'
import { FilterChip } from '@/components/filters/filter-chip'
import { TriStateChip } from '@/components/filters/tri-state-chip'
import type { Tri } from '@/lib/catalogFilters'

interface FacetPanelProps {
  title: string
  items: { id: string; label: string; count?: number }[]
  type: 'include' | 'tri'
  values: string[] | Record<string, Tri>
  onToggleInclude?: (id: string) => void
  onTriChange?: (id: string, next: Tri) => void
  onClearFacet?: () => void
}

export function FacetPanel(props: FacetPanelProps) {
  const [q, setQ] = React.useState('')
  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? props.items.filter(i => i.label.toLowerCase().includes(t)) : props.items
  }, [props.items, q])

  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{props.title}</h4>
        <button className="text-xs text-muted-foreground hover:underline" onClick={props.onClearFacet}>Clear</button>
      </header>

      <input
        className="w-full rounded border px-2 py-1 text-xs"
        placeholder={`Search ${props.title.toLowerCase()}…`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex flex-wrap gap-2 pt-1">
        {filtered.map((it) => {
          const suffix = it.count != null ? ` (${it.count})` : ''
          if (props.type === 'include') {
            const active = Array.isArray(props.values) && props.values.includes(it.id)
            return (
              <FilterChip
                key={it.id}
                label={it.label + suffix}
                active={!!active}
                onToggle={() => props.onToggleInclude?.(it.id)}
                onRemove={() => props.onToggleInclude?.(it.id)}
              />
            )
          } else {
            const v = (props.values as Record<string, Tri>)[it.id] ?? 0
            return (
              <TriStateChip
                key={it.id}
                label={it.label + suffix}
                value={v}
                onChange={(next) => props.onTriChange?.(it.id, next)}
              />
            )
          }
        })}
      </div>
    </section>
  )
}
