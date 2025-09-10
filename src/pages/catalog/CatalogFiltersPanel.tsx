import * as React from 'react'
import { FacetPanel } from '@/components/catalog/FacetPanel'
import { ActiveFiltersBar } from './ActiveFiltersBar'
import { createEmptyFilters, toggleArray, type Tri, type CatalogFilters } from '@/lib/catalogFilters'

export function CatalogFiltersPanel({
  initial, onCommit, facetData
}: {
  initial: CatalogFilters
  onCommit: (next: CatalogFilters) => void
  facetData: {
    categories: { id: string; label: string; count?: number }[]
    brands: { id: string; label: string; count?: number }[]
    suppliers: { id: string; label: string; count?: number }[]
  }
}) {
  const [pending, setPending] = React.useState<CatalogFilters>(initial)

  const set = (patch: Partial<CatalogFilters>) =>
    setPending(prev => ({ ...prev, ...patch }))

  React.useEffect(() => {
    const t = setTimeout(() => onCommit(pending), 180)
    return () => clearTimeout(t)
  }, [pending, onCommit])

  const onRemove = (spec:
    | { type:'category'; id:string }
    | { type:'brand'; id:string; mode:'include'|'exclude' }
    | { type:'supplier'; id:string }
    | { type:'availability' }
    | { type:'priceMin'|'priceMax' }
  ) => {
    setPending(prev => {
      const next = { ...prev }
      if (spec.type === 'category') {
        next.categories = (next.categories || []).filter(id => id !== spec.id)
      } else if (spec.type === 'brand') {
        const key = spec.mode === 'include' ? 'include' : 'exclude'
        next.brands = { ...next.brands!, [key]: next.brands![key].filter(id => id !== spec.id) }
      } else if (spec.type === 'supplier') {
        const s = { ...(next.suppliers || {}) }; delete s[spec.id]; next.suppliers = s
      } else if (spec.type === 'availability') {
        next.availability = 'all'
      } else if (spec.type === 'priceMin') {
        next.price = { ...(next.price||{}), min: undefined }
      } else if (spec.type === 'priceMax') {
        next.price = { ...(next.price||{}), max: undefined }
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <ActiveFiltersBar
        filters={pending}
        onClearAll={() => setPending(createEmptyFilters())}
        onRemove={onRemove}
      />

      <FacetPanel
        title="Categories"
        type="include"
        items={facetData.categories}
        values={pending.categories || []}
        onToggleInclude={(id) => set({ categories: toggleArray(pending.categories || [], id) })}
        onClearFacet={() => set({ categories: [] })}
      />

      <FacetPanel
        title="Brands"
        type="include"
        items={facetData.brands}
        values={pending.brands?.include || []}
        onToggleInclude={(id) => {
          const inc = toggleArray(pending.brands?.include || [], id)
          const exc = (pending.brands?.exclude || []).filter(x => x !== id)
          set({ brands: { include: inc, exclude: exc } })
        }}
        onClearFacet={() => set({ brands: { include: [], exclude: [] } })}
      />

      <FacetPanel
        title="Suppliers"
        type="tri"
        items={facetData.suppliers}
        values={pending.suppliers || {}}
        onTriChange={(id, nextTri) => {
          setPending(prev => {
            const s = { ...(prev.suppliers || {}) }
            if (nextTri === 0) delete s[id]; else s[id] = nextTri
            return { ...prev, suppliers: s }
          })
        }}
        onClearFacet={() => set({ suppliers: {} })}
      />
    </div>
  )
}
