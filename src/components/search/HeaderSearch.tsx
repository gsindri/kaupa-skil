import React, { useState, useEffect } from 'react'
import { SearchInput } from './SearchInput'
import { SearchResultsPopover } from './SearchResultsPopover'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'
import { Dialog, DialogContent } from '@/components/ui/dialog'

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
      }
    }, [dialogOpen, isDialog])

    const items = [
      ...sections.products.map((p) => ({ ...p, section: 'products' })),
      ...sections.suppliers.map((p) => ({ ...p, section: 'suppliers' })),
      ...sections.orders.map((p) => ({ ...p, section: 'orders' }))
    ]

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
          if (isDialog) {
            closeDialog(false)
          } else {
            setExpanded(false)
          }
        }
      } else if (e.key === 'Escape') {
        if (isDialog) {
          e.preventDefault()
          closeDialog(false)
        } else {
          setQuery('')
          setExpanded(false)
        }
      }
    }

    const handleSelect = (item: { id: string; name: string; section: string }) => {
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
      setExpanded(true)
    }

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
            className="max-w-2xl w-[min(90vw,640px)] gap-6 border-none bg-background/95 p-6 shadow-2xl backdrop-blur"
            onOpenAutoFocus={(event) => {
              event.preventDefault()
              requestAnimationFrame(() => {
                inputRef.current?.focus()
              })
            }}
            onCloseAutoFocus={(event) => event.preventDefault()}
          >
            <div className="flex flex-col gap-4">
              <div className="relative">
                <SearchInput
                  ref={setInputRef}
                  value={query}
                  onChange={setQuery}
                  onFocus={() => setExpanded(true)}
                  onBlur={() => {}}
                  onKeyDown={handleKeyDown}
                  expanded
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

