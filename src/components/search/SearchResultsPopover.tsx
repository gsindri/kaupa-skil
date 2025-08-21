import React from 'react'
import { ResultItem } from './ResultItem'
import { RecentSearches } from './RecentSearches'
import { SearchScope } from '@/hooks/useGlobalSearch'
import { cn } from '@/lib/utils'

interface SearchSections {
  products: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  orders: { id: string; name: string }[]
}

interface SearchResultsPopoverProps {
  open: boolean
  sections: SearchSections
  query: string
  activeIndex: number
  onHoverIndex: (i: number) => void
  onSelectItem: (item: { id: string; name: string; section: string }) => void
  recentSearches: string[]
  onRecentSelect: (q: string) => void
  scope: SearchScope
  onScopeChange: (s: SearchScope) => void
}

export function SearchResultsPopover({
  open,
  sections,
  query,
  activeIndex,
  onHoverIndex,
  onSelectItem,
  recentSearches,
  onRecentSelect,
  scope,
  onScopeChange
}: SearchResultsPopoverProps) {
  if (!open) return null

  const items = [
    ...sections.products.map((p) => ({ ...p, section: 'products' })),
    ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' })),
    ...sections.orders.map((p) => ({ ...p, section: 'orders' }))
  ]

  let currentIndex = -1

  const renderSection = (section: keyof SearchSections, label: string) => {
    const data = sections[section]
    if (data.length === 0) return null
    return (
      <div key={section}>
        <div className="px-3 py-1 text-xs font-medium text-muted-foreground">{label}</div>
        {data.map((item) => {
          currentIndex += 1
          return (
            <ResultItem
              key={item.id}
              item={{ ...item, section }}
              query={query}
              active={currentIndex === activeIndex}
              onMouseEnter={() => onHoverIndex(currentIndex)}
              onMouseDown={() => onSelectItem({ ...item, section })}
            />
          )
        })}
      </div>
    )
  }

  const hasResults = items.length > 0

  return (
    <div
      id="global-search-results"
      role="listbox"
      className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-background shadow-md"
    >
      <div className="flex gap-2 border-b p-2 text-xs">
        {(
          [
            { label: 'All', value: 'all' },
            { label: 'Products', value: 'products' },
            { label: 'Suppliers', value: 'suppliers' },
            { label: 'Orders', value: 'orders' }
          ] as { label: string; value: SearchScope }[]
        ).map((s) => (
          <button
            key={s.value}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onScopeChange(s.value)}
            className={cn(
              'rounded-full px-2 py-0.5',
              scope === s.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      {query && hasResults && (
        <>
          {renderSection('products', 'Products')}
          {renderSection('suppliers', 'Suppliers')}
          {renderSection('orders', 'Orders')}
        </>
      )}
      {query && !hasResults && (
        <div className="px-3 py-2 text-sm text-muted-foreground">No matches for '{query}'</div>
      )}
      {!query && (
        <RecentSearches items={recentSearches} onSelect={onRecentSelect} />
      )}
    </div>
  )
}

