import React, { useState, useEffect } from 'react'
import { SearchInput } from './SearchInput'
import { SearchResultsPopover } from './SearchResultsPopover'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'

function useRecentSearches(orgId: string) {
  const key = `recent-searches:${orgId}`
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) setItems(JSON.parse(stored))
    } catch (_e) {
      // ignore
    }
  }, [key])

  const add = (q: string) => {
    if (!q) return
    const next = [q, ...items.filter((i) => i !== q)].slice(0, 10)
    setItems(next)
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch (_e) {
      // ignore
    }
  }

  return { items, add }
}

export const HeaderSearch = React.forwardRef<HTMLInputElement>((_props, ref) => {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [scope, setScope] = useState<SearchScope>('all')
  const { sections, isLoading } = useGlobalSearch(query, scope)
  const { items: recent, add: addRecent } = useRecentSearches('default')
  const [activeIndex, setActiveIndex] = useState(0)

  const items = [
    ...sections.products.map((p) => ({ ...p, section: 'products' })),
    ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' })),
    ...sections.orders.map((p) => ({ ...p, section: 'orders' }))
  ]

  const open = expanded && (query.length > 0 || recent.length > 0)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (items[activeIndex]) {
        handleSelect(items[activeIndex])
      } else {
        addRecent(query)
        setExpanded(false)
      }
    } else if (e.key === 'Escape') {
      setQuery('')
      setExpanded(false)
    }
  }

  const handleSelect = (item: { id: string; name: string; section: string }) => {
    addRecent(query)
    setExpanded(false)
    setQuery('')
    // navigation is app-specific; omitted
  }

  const handleRecentSelect = (q: string) => {
    setQuery(q)
    setExpanded(true)
  }

  const handleBlur = () => {
    setTimeout(() => {
      setExpanded(false)
    }, 100)
  }

  return (
    <div className="relative">
      <SearchInput
        ref={ref}
        value={query}
        onChange={setQuery}
        onFocus={() => setExpanded(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        expanded={expanded}
        onClear={() => setQuery('')}
        isLoading={isLoading}
      />
      <SearchResultsPopover
        open={open}
        scope={scope}
        onScopeChange={setScope}
        sections={sections}
        query={query}
        activeIndex={activeIndex}
        onHoverIndex={setActiveIndex}
        onSelectItem={handleSelect}
        recentSearches={recent}
        onRecentSelect={handleRecentSelect}
      />
    </div>
  )
})

HeaderSearch.displayName = 'HeaderSearch'

