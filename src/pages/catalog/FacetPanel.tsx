import * as React from 'react'
import { FilterChip } from '@/components/ui/filter-chip'
import { TriStateChip } from '@/components/ui/tri-state-chip'
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
                selected={!!active}
                onSelectedChange={() => props.onToggleInclude?.(it.id)}
                onRemove={() => props.onToggleInclude?.(it.id)}
              >
                {it.label + suffix}
              </FilterChip>
            )
          } else {
            const v = (props.values as Record<string, Tri>)[it.id] ?? 0
            const state = v === 1 ? 'include' : v === -1 ? 'exclude' : 'off'
            return (
              <TriStateChip
                key={it.id}
                state={state}
                onStateChange={(next) =>
                  props.onTriChange?.(it.id, next === 'include' ? 1 : next === 'exclude' ? -1 : 0)
                }
                includeLabel={'✓ ' + it.label + suffix}
                excludeLabel={'⨯ ' + it.label + suffix}
                offLabel={it.label + suffix}
              />
            )
          }
        })}
      </div>
    </section>
  )
}
