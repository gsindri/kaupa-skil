import * as React from 'react'
import type { CatalogFilters, Tri } from '@/lib/catalogFilters'
import { X } from 'lucide-react'

export function ActiveFiltersBar({
  filters, onClearAll, onRemove
}: {
  filters: CatalogFilters
  onClearAll: () => void
  onRemove: (kind:
    | { type:'category'; id:string }
    | { type:'brand'; id:string; mode:'include'|'exclude' }
    | { type:'supplier'; id:string }
    | { type:'availability' }
    | { type:'priceMin'|'priceMax' }
  ) => void
}) {
  const chips: Array<{ key:string; label:string; onClick:()=>void }> = []

  filters.categories?.forEach(id => chips.push({
    key:`cat:${id}`, label:`Category: ${id}`, onClick:()=>onRemove({type:'category', id})
  }))
  filters.brands?.include.forEach(id => chips.push({
    key:`brand+:${id}`, label:`Brand: ${id}`, onClick:()=>onRemove({type:'brand', id, mode:'include'})
  }))
  filters.brands?.exclude.forEach(id => chips.push({
    key:`brand-:${id}`, label:`Exclude brand: ${id}`, onClick:()=>onRemove({type:'brand', id, mode:'exclude'})
  }))
  Object.entries(filters.suppliers || {}).forEach(([id, tri]) => {
    if (tri === 0) return
    chips.push({
      key:`sup:${id}`, label:`${tri===1?'Supplier':'Exclude supplier'}: ${id}`, onClick:()=>onRemove({type:'supplier', id})
    })
  })
  if (filters.availability && filters.availability !== 'all') {
    chips.push({ key:'avail', label:`Availability: ${filters.availability}`, onClick:()=>onRemove({type:'availability'}) })
  }
  if (filters.price?.min != null) chips.push({ key:'pmin', label:`Min: ${filters.price.min}`, onClick:()=>onRemove({type:'priceMin'}) })
  if (filters.price?.max != null) chips.push({ key:'pmax', label:`Max: ${filters.price.max}`, onClick:()=>onRemove({type:'priceMax'}) })

  if (chips.length === 0) return null

  return (
    <div className="sticky top-[calc(var(--chrome-h))] z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto flex flex-wrap items-center gap-2 px-4 py-2">
        {chips.map(c => (
          <button key={c.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs" onClick={c.onClick}>
            {c.label} <X className="h-3 w-3 opacity-70" />
          </button>
        ))}
        <button className="ml-auto text-xs text-muted-foreground hover:underline" onClick={onClearAll}>
          Clear all
        </button>
      </div>
    </div>
  )
}
