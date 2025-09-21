import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchResultSection = 'products' | 'suppliers' | 'orders'

type SearchResultItem = {
  id: string
  name: string
  section: SearchResultSection
  metadata?: {
    subtitle?: string
    availability?: string
    price?: string
    imageUrl?: string
  }
}

type DialogEntry =
  | { type: 'recent'; query: string }
  | { type: 'result'; item: SearchResultItem }

const SCOPE_OPTIONS: { label: string; value: SearchScope }[] = [
  { label: 'All', value: 'all' },
  { label: 'Products', value: 'products' },
  { label: 'Suppliers', value: 'suppliers' },
  { label: 'Orders', value: 'orders' }
]

const SECTION_METADATA: Record<
  SearchResultSection,
  { heading: string; meta: string; badge: string }
> = {
  products: { heading: 'Products', meta: 'Product', badge: 'P' },
  suppliers: { heading: 'Suppliers', meta: 'Supplier', badge: 'S' },
  orders: { heading: 'Orders', meta: 'Order', badge: 'O' }
}

const SECTION_ORDER: SearchResultSection[] = ['products', 'suppliers', 'orders']

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

  const add = React.useCallback(
    (q: string) => {
      if (!q) return
      setItems((prev) => {
        const next = [q, ...prev.filter((i) => i !== q)].slice(0, 10)
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch (_e) {
          // ignore
        }
        return next
      })
    },
    [key],
  )

  const remove = React.useCallback(
    (q: string) => {
      setItems((prev) => {
        const next = prev.filter((item) => item !== q)
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch (_e) {
          // ignore
        }
        return next
      })
    },
    [key],
  )

  return { items, add, remove }
}

interface HeaderSearchProps {
  mode?: 'dialog'
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const HeaderSearch = React.forwardRef<HTMLInputElement, HeaderSearchProps>(
  (props, ref) => {
    const { mode = 'dialog', open: controlledOpen, onOpenChange } = props
    void mode
    const navigate = useNavigate()
    const [query, setQuery] = useState('')
    const [scope, setScope] = useState<SearchScope>('all')
    const { sections, isLoading } = useGlobalSearch(query, scope)
    const { items: recent, add: addRecent, remove: removeRecent } = useRecentSearches('default')
    const [activeDialogIndex, setActiveDialogIndex] = useState(0)
    const [internalDialogOpen, setInternalDialogOpen] = useState(false)

    const dialogOpen = controlledOpen ?? internalDialogOpen

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const setInputRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLInputElement | null>).current = node
        }
      },
      [ref]
    )

    useEffect(() => {
      if (!dialogOpen) {
        setQuery('')
        setScope('all')
      }
      setActiveDialogIndex(0)
    }, [dialogOpen])

    const items: SearchResultItem[] = React.useMemo(
      () => [
        ...sections.products.items.map((p) => ({ ...p, section: 'products' as const, metadata: p.metadata })),
        ...sections.suppliers.items.map((p) => ({ ...p, section: 'suppliers' as const, metadata: p.metadata })),
        ...sections.orders.items.map((p) => ({ ...p, section: 'orders' as const, metadata: p.metadata }))
      ],
      [sections]
    )

    const dialogEntries: DialogEntry[] = React.useMemo(() => {
      if (!query) {
        return recent.map((q) => ({ type: 'recent' as const, query: q }))
      }

      return items.map((item) => ({ type: 'result' as const, item }))
    }, [items, query, recent])

    const closeDialog = (nextOpen: boolean) => {
      if (controlledOpen === undefined) {
        setInternalDialogOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const total = dialogEntries.length

      if (e.key === 'ArrowDown') {
        if (total === 0) return
        e.preventDefault()
        setActiveDialogIndex((index) => Math.min(index + 1, total - 1))
      } else if (e.key === 'ArrowUp') {
        if (total === 0) return
        e.preventDefault()
        setActiveDialogIndex((index) => Math.max(index - 1, 0))
      } else if (e.key === 'Enter') {
        const entry = dialogEntries[activeDialogIndex]
        if (entry) {
          handleDialogEntrySelect(entry)
        } else if (query) {
          addRecent(query)
          closeDialog(false)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeDialog(false)
      }
    }

    const handleSelect = (item: SearchResultItem) => {
      addRecent(query)
      closeDialog(false)
      setQuery('')
      // navigation is app-specific; omitted
    }

    const handleRecentSelect = (q: string) => {
      setQuery(q)
      setActiveDialogIndex(0)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(q.length, q.length)
      })
    }

    const handleViewAll = (section: SearchResultSection, searchQuery: string) => {
      addRecent(searchQuery)
      closeDialog(false)
      
      // Navigate to appropriate page with search query
      switch (section) {
        case 'products':
          navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`)
          break
        case 'suppliers':
          navigate(`/suppliers?search=${encodeURIComponent(searchQuery)}`)
          break
        case 'orders':
          navigate(`/orders?search=${encodeURIComponent(searchQuery)}`)
          break
      }
    }

    const handleDialogEntrySelect = (entry: DialogEntry) => {
      if (entry.type === 'result') {
        handleSelect(entry.item)
        return
      }

      handleRecentSelect(entry.query)
    }

    useEffect(() => {
      if (dialogEntries.length === 0) {
        setActiveDialogIndex(0)
        return
      }

      setActiveDialogIndex((index) => Math.min(index, dialogEntries.length - 1))
    }, [dialogEntries])

    return (
      <Dialog open={dialogOpen} onOpenChange={(value) => closeDialog(value)}>
        <DialogContent
          className="w-[760px] max-w-[92vw] overflow-hidden rounded-[16px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] p-0 shadow-[var(--elev-shadow)] [&>button]:hidden"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            requestAnimationFrame(() => {
              inputRef.current?.focus()
            })
          }}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <div className="flex h-full flex-col bg-[color:var(--surface-pop)]">
            <div className="px-3 pt-3">
              <div className="flex h-14 items-center gap-2 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-3">
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--text-muted)]"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
                <input
                  ref={setInputRef}
                  role="combobox"
                  aria-expanded={dialogEntries.length > 0}
                  aria-controls="header-search-results"
                  placeholder="Search products, suppliers, orders…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-[15px] text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
                  >
                    ✕
                  </button>
                ) : isLoading ? (
                  <span className="flex h-10 w-10 items-center justify-center text-[color:var(--text-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  </span>
                ) : (
                  <span className="flex items-center rounded-[6px] border border-[color:var(--surface-ring)] px-1.5 py-[0.125rem] text-[12px] text-[color:var(--text-muted)] opacity-70">⌘K</span>
                )}
              </div>
            </div>

            <div className="px-3 pb-2 pt-2">
              <div className="grid grid-cols-4 gap-1 rounded-[12px] border border-[color:var(--surface-ring)] p-1">
                {SCOPE_OPTIONS.map((option) => {
                  const selected = scope === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setScope(option.value)}
                      className={cn(
                        'h-10 rounded-[10px] text-[14px] font-medium text-[color:var(--text-muted)] transition-colors',
                        selected
                          ? 'bg-white/[0.08] text-[color:var(--text)] font-semibold'
                          : 'hover:bg-white/[0.04]'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <div
                id="header-search-results"
                role="listbox"
                className="max-h-[56vh] overflow-y-auto pb-3"
              >
                <DialogResults
                  query={query}
                  isLoading={isLoading}
                  sections={sections}
                  dialogEntries={dialogEntries}
                  activeIndex={activeDialogIndex}
                  onHoverIndex={setActiveDialogIndex}
                  onEntrySelect={handleDialogEntrySelect}
                  onRemoveRecent={removeRecent}
                  onViewAll={handleViewAll}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)

HeaderSearch.displayName = 'HeaderSearch'

interface DialogResultsProps {
  query: string
  isLoading: boolean
  sections: any // Will be updated to proper type from useGlobalSearch
  dialogEntries: DialogEntry[]
  activeIndex: number
  onHoverIndex: (index: number) => void
  onEntrySelect: (entry: DialogEntry) => void
  onRemoveRecent: (query: string) => void
  onViewAll: (section: SearchResultSection, searchQuery: string) => void
}

function DialogResults({
  query,
  isLoading,
  sections,
  dialogEntries,
  activeIndex,
  onHoverIndex,
  onEntrySelect,
  onRemoveRecent,
  onViewAll,
}: DialogResultsProps) {
  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length > 0

  const recentsEntries: { entry: Extract<DialogEntry, { type: 'recent' }>; index: number }[] = []
  const resultEntries: { entry: Extract<DialogEntry, { type: 'result' }>; index: number }[] = []

  dialogEntries.forEach((entry, index) => {
    if (entry.type === 'recent') {
      recentsEntries.push({ entry, index })
    } else {
      resultEntries.push({ entry, index })
    }
  })

  const sectionsContent: React.ReactNode[] = []

  if (!hasQuery && recentsEntries.length > 0) {
    sectionsContent.push(
      <div key="recent" className="space-y-[2px] pb-1">
        <DialogSection label="Recent searches" />
        {recentsEntries.map(({ entry, index }) => (
          <RecentDialogRow
            key={`recent-${entry.query}-${index}`}
            query={entry.query}
            active={activeIndex === index}
            onHover={() => onHoverIndex(index)}
            onSelect={() => onEntrySelect(entry)}
            onRemove={() => onRemoveRecent(entry.query)}
          />
        ))}
      </div>
    )
  }

  if (hasQuery && resultEntries.length > 0) {
    SECTION_ORDER.forEach((section) => {
      const sectionEntries = resultEntries.filter(
        ({ entry }) => entry.item.section === section
      )
      if (sectionEntries.length === 0) return

      const metadata = SECTION_METADATA[section]
      const sectionData = sections[section]

      sectionsContent.push(
        <div key={section} className="space-y-[2px] pb-1">
          <DialogSection label={`${metadata.heading} (${sectionData.totalCount})`} />
          {sectionEntries.map(({ entry, index }) => (
            <DialogRow
              key={entry.item.id}
              title={entry.item.name}
              subtitle={entry.item.metadata?.subtitle}
              meta={metadata.meta}
              icon={<DialogBadge>{metadata.badge}</DialogBadge>}
              active={activeIndex === index}
              onHover={() => onHoverIndex(index)}
              onSelect={() => onEntrySelect(entry)}
            />
          ))}
          {sectionData.hasMore && (
            <div className="px-3 py-2">
              <button
                onClick={() => onViewAll(section, trimmedQuery)}
                className="text-sm text-[color:var(--text-muted)] hover:text-[color:var(--text)] transition-colors"
              >
                View all {sectionData.totalCount} {metadata.heading.toLowerCase()}
              </button>
            </div>
          )}
        </div>
      )
    })
  }

  const showLoadingState = isLoading && hasQuery && resultEntries.length === 0

  if (!hasQuery && recentsEntries.length === 0) {
    sectionsContent.push(
      <div key="empty-initial" className="px-3 py-6 text-[14px] text-[color:var(--text-muted)]">
        Start typing to search for products, suppliers, or orders.
      </div>
    )
  }

  if (showLoadingState) {
    sectionsContent.unshift(
      <div key="loading" className="flex items-center gap-2 px-3 py-6 text-[14px] text-[color:var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        Searching for “{trimmedQuery}”…
      </div>
    )
  }

  if (hasQuery && !isLoading && resultEntries.length === 0) {
    sectionsContent.push(
      <div key="empty-results" className="px-3 py-6 text-[14px] text-[color:var(--text-muted)]">
        No results. Try a product name or supplier.
      </div>
    )
  }

  return <div className="space-y-1 pb-1">{sectionsContent}</div>
}

interface RecentDialogRowProps {
  query: string
  active: boolean
  onHover: () => void
  onSelect: () => void
  onRemove: () => void
}

function RecentDialogRow({ query, active, onHover, onSelect, onRemove }: RecentDialogRowProps) {
  return (
    <div
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
      className={cn(
        'grid w-full grid-cols-[20px,1fr,auto] items-center gap-2.5 rounded-[10px] px-3 text-left text-[color:var(--text)] transition-colors',
        'h-[50px]',
        active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
      )}
    >
      <div className="flex items-center justify-center">
        <span className="text-[12px] text-[color:var(--text-muted)] opacity-60">↺</span>
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-medium">{query}</div>
      </div>
      <button
        type="button"
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onRemove()
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
        aria-label={`Remove ${query} from recent searches`}
      >
        ✕
      </button>
    </div>
  )
}

function DialogSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-1">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] opacity-80">
        {label}
      </div>
      <div className="h-px bg-[color:var(--surface-ring)] opacity-25" />
    </div>
  )
}

interface DialogRowProps {
  title: string
  subtitle?: string
  meta?: string
  icon?: React.ReactNode
  active: boolean
  onHover: () => void
  onSelect: () => void
}

function DialogRow({ title, subtitle, meta, icon, active, onHover, onSelect }: DialogRowProps) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onMouseDown={(event) => {
        event.preventDefault()
        onSelect()
      }}
      className={cn(
        'grid w-full grid-cols-[20px,1fr,auto] items-center gap-2.5 rounded-[10px] px-3 text-left text-[color:var(--text)] transition-colors',
        'h-[50px]',
        active ? 'bg-white/[0.08]' : 'hover:bg-white/[0.04]'
      )}
    >
      <div className="flex items-center justify-center">
        {icon ?? <DialogBadge>{title.charAt(0).toUpperCase()}</DialogBadge>}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {subtitle && (
          <div className="truncate text-[13px] text-[color:var(--text-muted)]">{subtitle}</div>
        )}
      </div>
      <div
        className={cn(
          'text-right text-[13px] text-[color:var(--text-muted)]',
          meta ? 'pl-3' : 'pl-0'
        )}
      >
        {meta}
      </div>
    </button>
  )
}

function DialogBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-white/[0.08] text-[11px] font-semibold uppercase text-[color:var(--text-muted)]">
      {children}
    </div>
  )
}

