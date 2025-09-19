import React, { useState, useEffect } from 'react'
import { SearchInput } from './SearchInput'
import { SearchResultsPopover } from './SearchResultsPopover'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type SearchResultSection = 'products' | 'suppliers' | 'orders'

type SearchResultItem = {
  id: string
  name: string
  section: SearchResultSection
}

interface Suggestion {
  id: string
  title: string
  subtitle?: string
  meta: string
  scope: SearchScope
}

type DialogEntry =
  | { type: 'recent'; query: string }
  | { type: 'suggestion'; suggestion: Suggestion }
  | { type: 'result'; item: SearchResultItem }

const SCOPE_OPTIONS: { label: string; value: SearchScope }[] = [
  { label: 'All', value: 'all' },
  { label: 'Products', value: 'products' },
  { label: 'Suppliers', value: 'suppliers' },
  { label: 'Orders', value: 'orders' }
]

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: 'suggestion-eggs',
    title: 'Eggs (12-pack, free-range)',
    meta: 'Products',
    scope: 'products'
  },
  {
    id: 'suggestion-eimskip',
    title: 'Eimskip Food Service',
    meta: 'Supplier',
    scope: 'suppliers'
  },
  {
    id: 'suggestion-order-review',
    title: 'Review pending orders',
    meta: 'Orders',
    scope: 'orders'
  }
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

type HeaderSearchMode = 'inline' | 'dialog'

interface HeaderSearchProps {
  mode?: HeaderSearchMode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const HeaderSearch = React.forwardRef<HTMLInputElement, HeaderSearchProps>(
  ({ mode = 'inline', open: controlledOpen, onOpenChange }, ref) => {
    const isDialog = mode === 'dialog'
    const [query, setQuery] = useState('')
    const [expanded, setExpanded] = useState(false)
    const [scope, setScope] = useState<SearchScope>('all')
    const { sections, isLoading } = useGlobalSearch(query, scope)
    const { items: recent, add: addRecent } = useRecentSearches('default')
    const [activeIndex, setActiveIndex] = useState(0)
    const [activeDialogIndex, setActiveDialogIndex] = useState(0)
    const [internalDialogOpen, setInternalDialogOpen] = useState(false)

    const dialogOpen = isDialog ? controlledOpen ?? internalDialogOpen : false

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
      if (!isDialog) return
      if (dialogOpen) {
        setExpanded(true)
      } else {
        setExpanded(false)
        setQuery('')
        setScope('all')
        setActiveIndex(0)
        setActiveDialogIndex(0)
      }
    }, [dialogOpen, isDialog])

    const items: SearchResultItem[] = React.useMemo(
      () => [
        ...sections.products.map((p) => ({ ...p, section: 'products' as const })),
        ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' as const })),
        ...sections.orders.map((p) => ({ ...p, section: 'orders' as const }))
      ],
      [sections]
    )

    const dialogEntries: DialogEntry[] = React.useMemo(() => {
      if (!isDialog) {
        return items.map((item) => ({ type: 'result', item }))
      }

      if (!query) {
        return [
          ...recent.map((q) => ({ type: 'recent' as const, query: q })),
          ...DEFAULT_SUGGESTIONS.map((suggestion) => ({
            type: 'suggestion' as const,
            suggestion
          }))
        ]
      }

      return items.map((item) => ({ type: 'result' as const, item }))
    }, [isDialog, items, query, recent])

    const resultsOpen = isDialog
      ? dialogOpen && (query.length > 0 || recent.length > 0)
      : expanded && (query.length > 0 || recent.length > 0)

    const closeDialog = (nextOpen: boolean) => {
      if (!isDialog) return
      if (controlledOpen === undefined) {
        setInternalDialogOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isDialog) {
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
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (items.length === 0 ? 0 : Math.min(i + 1, items.length - 1)))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        if (items[activeIndex]) {
          handleSelect(items[activeIndex])
        } else if (query) {
          addRecent(query)
          setExpanded(false)
        }
      } else if (e.key === 'Escape') {
        setQuery('')
        setExpanded(false)
      }
    }

    const handleSelect = (item: SearchResultItem) => {
      addRecent(query)
      if (isDialog) {
        closeDialog(false)
      } else {
        setExpanded(false)
      }
      setQuery('')
      // navigation is app-specific; omitted
    }

    const handleRecentSelect = (q: string) => {
      setQuery(q)
      if (isDialog) {
        setActiveDialogIndex(0)
        requestAnimationFrame(() => {
          inputRef.current?.focus()
          inputRef.current?.setSelectionRange(q.length, q.length)
        })
      } else {
        setExpanded(true)
      }
    }

    const handleDialogEntrySelect = (entry: DialogEntry) => {
      if (entry.type === 'result') {
        handleSelect(entry.item)
        return
      }

      if (entry.type === 'recent') {
        handleRecentSelect(entry.query)
        return
      }

      const suggestion = entry.suggestion
      setScope(suggestion.scope)
      setQuery(suggestion.title)
      setActiveDialogIndex(0)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.setSelectionRange(suggestion.title.length, suggestion.title.length)
      })
    }

    useEffect(() => {
      if (!isDialog) return
      if (dialogEntries.length === 0) {
        setActiveDialogIndex(0)
        return
      }

      setActiveDialogIndex((index) => Math.min(index, dialogEntries.length - 1))
    }, [dialogEntries, isDialog])

    const handleBlur = () => {
      if (isDialog) return
      setTimeout(() => {
        setExpanded(false)
      }, 100)
    }

    if (isDialog) {
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
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--text-muted)]"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <Search className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <input
                    ref={setInputRef}
                    role="combobox"
                    aria-expanded={dialogEntries.length > 0}
                    aria-controls="header-search-results"
                    placeholder="Search products, suppliers, orders…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setExpanded(true)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-[15px] text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-muted)]"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="flex h-9 min-w-9 items-center justify-center rounded-full text-[14px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)]"
                    >
                      ✕
                    </button>
                  ) : isLoading ? (
                    <span className="flex h-9 min-w-9 items-center justify-center text-[color:var(--text-muted)]">
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    </span>
                  ) : (
                    <span className="flex h-9 min-w-9 items-center justify-center text-[color:var(--text-muted)]">⌘K</span>
                  )}
                </div>
              </div>

              <div className="px-3 pb-2 pt-2">
                <div className="grid h-11 grid-cols-4 gap-1 rounded-[12px] border border-[color:var(--surface-ring)] p-1">
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
                          'rounded-[10px] text-[14px] transition-colors',
                          selected
                            ? 'bg-white/10 text-[color:var(--text)]'
                            : 'text-[color:var(--text-muted)] hover:bg-white/5'
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
                  className="max-h-[60vh] overflow-y-auto pb-3"
                >
                  <DialogResults
                    query={query}
                    isLoading={isLoading}
                    dialogEntries={dialogEntries}
                    activeIndex={activeDialogIndex}
                    onHoverIndex={setActiveDialogIndex}
                    onEntrySelect={handleDialogEntrySelect}
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <div className="relative">
        <SearchInput
          ref={setInputRef}
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
          open={resultsOpen}
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
  }
)

HeaderSearch.displayName = 'HeaderSearch'

interface DialogResultsProps {
  query: string
  isLoading: boolean
  dialogEntries: DialogEntry[]
  activeIndex: number
  onHoverIndex: (index: number) => void
  onEntrySelect: (entry: DialogEntry) => void
}

function DialogResults({
  query,
  isLoading,
  dialogEntries,
  activeIndex,
  onHoverIndex,
  onEntrySelect
}: DialogResultsProps) {
  const trimmedQuery = query.trim()
  const hasQuery = trimmedQuery.length > 0

  const recentsEntries: { entry: Extract<DialogEntry, { type: 'recent' }>; index: number }[] = []
  const suggestionEntries: { entry: Extract<DialogEntry, { type: 'suggestion' }>; index: number }[] = []
  const resultEntries: { entry: Extract<DialogEntry, { type: 'result' }>; index: number }[] = []

  dialogEntries.forEach((entry, index) => {
    if (entry.type === 'recent') {
      recentsEntries.push({ entry, index })
    } else if (entry.type === 'suggestion') {
      suggestionEntries.push({ entry, index })
    } else {
      resultEntries.push({ entry, index })
    }
  })

  const sectionsContent: React.ReactNode[] = []

  if (!hasQuery && recentsEntries.length > 0) {
    sectionsContent.push(
      <div key="recent" className="pb-1">
        <DialogSection label="Recent searches" />
        {recentsEntries.map(({ entry, index }) => (
          <DialogRow
            key={`recent-${entry.query}-${index}`}
            title={entry.query}
            meta=""
            icon={<DialogBadge>↺</DialogBadge>}
            active={activeIndex === index}
            onHover={() => onHoverIndex(index)}
            onSelect={() => onEntrySelect(entry)}
          />
        ))}
      </div>
    )
  }

  if (!hasQuery && suggestionEntries.length > 0) {
    sectionsContent.push(
      <div key="suggestions" className="pb-1">
        <DialogSection label="Suggestions" />
        {suggestionEntries.map(({ entry, index }) => (
          <DialogRow
            key={entry.suggestion.id}
            title={entry.suggestion.title}
            subtitle={entry.suggestion.subtitle}
            meta={entry.suggestion.meta}
            icon={<DialogBadge>★</DialogBadge>}
            active={activeIndex === index}
            onHover={() => onHoverIndex(index)}
            onSelect={() => onEntrySelect(entry)}
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

      sectionsContent.push(
        <div key={section} className="pb-1">
          <DialogSection label={metadata.heading} />
          {sectionEntries.map(({ entry, index }) => (
            <DialogRow
              key={entry.item.id}
              title={entry.item.name}
              meta={metadata.meta}
              icon={<DialogBadge>{metadata.badge}</DialogBadge>}
              active={activeIndex === index}
              onHover={() => onHoverIndex(index)}
              onSelect={() => onEntrySelect(entry)}
            />
          ))}
        </div>
      )
    })
  }

  const showLoadingState = isLoading && hasQuery && resultEntries.length === 0

  if (!hasQuery && recentsEntries.length === 0 && suggestionEntries.length === 0) {
    sectionsContent.push(
      <div key="empty-initial" className="px-4 py-6 text-[14px] text-[color:var(--text-muted)]">
        Start typing to search for products, suppliers, or orders.
      </div>
    )
  }

  if (showLoadingState) {
    sectionsContent.unshift(
      <div key="loading" className="flex items-center gap-2 px-4 py-6 text-[14px] text-[color:var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
        Searching for “{trimmedQuery}”…
      </div>
    )
  }

  if (hasQuery && !isLoading && resultEntries.length === 0) {
    sectionsContent.push(
      <div key="empty-results" className="px-4 py-6 text-[14px] text-[color:var(--text-muted)]">
        No results. Try a product name or supplier.
      </div>
    )
  }

  return <div className="pb-1">{sectionsContent}</div>
}

function DialogSection({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3">
      <div className="mb-2 text-[12px] font-semibold tracking-[0.08em] text-[color:var(--text-muted)] uppercase">
        {label}
      </div>
      <div className="h-px bg-[color:var(--surface-ring)]" />
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
        'grid w-full grid-cols-[32px,1fr,auto] items-center rounded-[12px] px-4 text-left text-[color:var(--text)] transition-colors',
        'h-14',
        active ? 'bg-white/12' : 'hover:bg-white/[0.06]'
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
      <div className="pl-3 text-right text-[13px] text-[color:var(--text-muted)]">{meta}</div>
    </button>
  )
}

function DialogBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.08] text-[13px] font-medium text-[color:var(--text-muted)]">
      {children}
    </div>
  )
}

