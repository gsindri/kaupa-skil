import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGlobalSearch, SearchScope } from '@/hooks/useGlobalSearch'
import type { SearchItem, SearchSections } from '@/hooks/useGlobalSearch'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Loader2, Search, Package, Building2, ClipboardList, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import AvailabilityBadge from '@/components/catalog/AvailabilityBadge'
import { SupplierLogo } from '@/components/catalog/SupplierLogo'
import { QuantityStepper } from '@/components/cart/QuantityStepper'
import { LazyImage } from '@/components/ui/LazyImage'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/useBasket'
import { ProductQuickPeekDrawer } from '@/components/search/ProductQuickPeekDrawer'

type SearchResultSection = 'products' | 'suppliers' | 'orders'

type SearchResultItem = SearchItem & {
  section: SearchResultSection
}

type DialogEntry =
  | { type: 'recent'; query: string }
  | { type: 'result'; item: SearchResultItem }

const SCOPE_OPTION_CONFIG: ReadonlyArray<{ value: SearchScope }> = [
  { value: 'all' },
  { value: 'products' },
  { value: 'suppliers' },
  { value: 'orders' }
]

const SECTION_CONFIG: Record<
  SearchResultSection,
  {
    icon: React.ComponentType<any>
  }
> = {
  products: { icon: Package },
  suppliers: { icon: Building2 },
  orders: { icon: ClipboardList }
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
    const { t } = useTranslation(undefined, { keyPrefix: 'search.header' })
    const [query, setQuery] = useState('')
    const [scope, setScope] = useState<SearchScope>('all')
    const { sections, isLoading } = useGlobalSearch(query, scope)
    const { items: recent, add: addRecent, remove: removeRecent } = useRecentSearches('default')
    const [activeDialogIndex, setActiveDialogIndex] = useState(0)
    const [internalDialogOpen, setInternalDialogOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<SearchResultItem | null>(null)
    const [productDrawerOpen, setProductDrawerOpen] = useState(false)
    const [searchFocused, setSearchFocused] = useState(false)

    const dialogOpen = controlledOpen ?? internalDialogOpen

    const scopeOptions = React.useMemo(
      () =>
        SCOPE_OPTION_CONFIG.map(({ value }) => ({
          value,
          label: t(`scopes.${value}`)
        })),
      [t]
    )

    const sectionMetadata = React.useMemo(
      () => ({
        products: {
          heading: t('sections.products.heading'),
          meta: t('sections.products.meta'),
          badge: t('sections.products.badge'),
          icon: SECTION_CONFIG.products.icon
        },
        suppliers: {
          heading: t('sections.suppliers.heading'),
          meta: t('sections.suppliers.meta'),
          badge: t('sections.suppliers.badge'),
          icon: SECTION_CONFIG.suppliers.icon
        },
        orders: {
          heading: t('sections.orders.heading'),
          meta: t('sections.orders.meta'),
          badge: t('sections.orders.badge'),
          icon: SECTION_CONFIG.orders.icon
        }
      }),
      [t]
    ) as Record<
      SearchResultSection,
      {
        heading: string
        meta: string
        badge: string
        icon: React.ComponentType<any>
      }
    >

    const inputRef = React.useRef<HTMLInputElement | null>(null)
    const searchShellRef = React.useRef<HTMLDivElement | null>(null)
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

    useEffect(() => {
      if (!dialogOpen) {
        setProductDrawerOpen(false)
        setSelectedProduct(null)
      }
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
      if (!nextOpen) {
        setSearchFocused(false)
      }
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
      const trimmed = query.trim()
      const recentValue = trimmed || item.name

      if (item.section === 'products') {
        addRecent(recentValue)
        setSelectedProduct(item)
        setProductDrawerOpen(true)
        return
      }

      addRecent(recentValue)
      closeDialog(false)
      setQuery('')
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

    const handleProductDrawerChange = (nextOpen: boolean) => {
      if (nextOpen) {
        setProductDrawerOpen(true)
        return
      }
      setProductDrawerOpen(false)
      setSelectedProduct(null)
      if (dialogOpen) {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      }
    }

    const handleViewDetailsFromDrawer = (productId: string) => {
      const product = selectedProduct
      if (!productId || !product) {
        handleProductDrawerChange(false)
        return
      }

      handleProductDrawerChange(false)
      closeDialog(false)
      setQuery('')

      const params = new URLSearchParams()
      if (product.name) {
        params.set('search', product.name)
      }
      const queryString = params.toString()
      const target = queryString ? `/catalog?${queryString}#${productId}` : `/catalog#${productId}`
      navigate(target)
    }

    useEffect(() => {
      if (dialogEntries.length === 0) {
        setActiveDialogIndex(0)
        return
      }

      setActiveDialogIndex((index) => Math.min(index, dialogEntries.length - 1))
    }, [dialogEntries])

    return (
      <>
        <Dialog open={dialogOpen} onOpenChange={(value) => closeDialog(value)}>
        <DialogContent
          variant="spotlight"
          hideCloseButton
          overlayClassName="bg-[rgba(7,15,25,0.12)] backdrop-blur-[12px]"
          className="w-[880px] max-w-[96vw] overflow-hidden rounded-[16px] border border-[color:var(--surface-ring)]/80 bg-[color:var(--surface-pop)] p-0 shadow-[0_48px_140px_-56px_rgba(5,12,24,0.85)]"
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
              <div
                ref={searchShellRef}
                onFocus={() => setSearchFocused(true)}
                onBlur={(event) => {
                  const currentTarget = event.currentTarget
                  requestAnimationFrame(() => {
                    if (!currentTarget.contains(document.activeElement)) {
                      setSearchFocused(false)
                    }
                  })
                }}
                className={cn(
                  'flex h-16 items-center gap-3 rounded-[18px] border px-4 shadow-[0_24px_72px_-48px_rgba(5,12,26,0.75)] backdrop-blur-[18px] transition-all duration-200',
                  searchFocused
                    ? 'border-[color:var(--brand-accent)] bg-[color:var(--surface-pop-2)] shadow-[0_32px_96px_-48px_rgba(6,14,30,0.88),0_0_0_1px_rgba(245,158,11,0.35)]'
                    : 'border-[rgba(132,179,238,0.32)] bg-[color:var(--surface-pop-2)]/92'
                )}
              >
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(245,158,11,0.12)] text-[color:var(--brand-accent)] ring-1 ring-inset ring-[rgba(245,158,11,0.32)]"
                  onMouseDown={(event) => event.preventDefault()}
                >
                  <Search className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
                <input
                  ref={setInputRef}
                  role="combobox"
                  aria-expanded={dialogEntries.length > 0}
                  aria-controls="header-search-results"
                  placeholder={t('input.placeholder')}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-[15px] text-[color:var(--text)] outline-none placeholder:text-[color:var(--text-subtle)]"
                />
                <div className="flex items-center gap-1.5">
                  {query ? (
                    <button
                      type="button"
                      aria-label={t('actions.clear')}
                      onClick={() => setQuery('')}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-[14px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-pop-2)]"
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
                  <button
                    type="button"
                    aria-label={t('actions.close')}
                    onClick={() => closeDialog(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--text-muted)] transition-colors hover:bg-white/[0.06] hover:text-[color:var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-pop-2)]"
                  >
                    <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>

            <div className={cn('px-3 pb-2 pt-2 transition-opacity duration-200', searchFocused ? 'opacity-80' : 'opacity-100')}>
              <div className="grid grid-cols-4 gap-1 rounded-[14px] border border-white/10 bg-white/[0.02] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {scopeOptions.map((option) => {
                  const selected = scope === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setScope(option.value)}
                      className={cn(
                        'h-10 rounded-[12px] text-[14px] font-medium text-[color:var(--text-muted)] transition-all duration-150 ease-out',
                        selected
                          ? 'bg-[color:var(--button-primary)]/20 text-[color:var(--text)] font-semibold shadow-[0_18px_40px_-30px_rgba(11,91,211,0.75)] ring-1 ring-inset ring-[color:var(--button-primary)]/50'
                          : 'hover:bg-white/[0.05] hover:text-[color:var(--text)]'
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div
              className={cn(
                'flex-1 overflow-hidden transition-opacity duration-200',
                searchFocused ? 'opacity-90' : 'opacity-100'
              )}
            >
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
      <ProductQuickPeekDrawer
        open={productDrawerOpen && Boolean(selectedProduct)}
        productId={selectedProduct?.id ?? null}
        item={selectedProduct}
        onOpenChange={handleProductDrawerChange}
        onViewDetails={handleViewDetailsFromDrawer}
      />
    </>
    )
  }
)

HeaderSearch.displayName = 'HeaderSearch'

interface DialogResultsProps {
  query: string
  isLoading: boolean
  sections: SearchSections
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
  const uniqueSections = new Set(resultEntries.map(({ entry }) => entry.item.section))
  const shouldShowMeta = uniqueSections.size > 1

  if (!hasQuery && recentsEntries.length > 0) {
    sectionsContent.push(
      <div key="recent" className="space-y-[2px] pb-1">
        <DialogSection label={t('sections.recent.label')} />
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

      const metadata = sectionMetadata[section]
      const sectionData = sections[section]

      sectionsContent.push(
        <div key={section} className="space-y-[2px] pb-1">
          <DialogSection
            label={t(`sections.${section}.label`, {
              count: sectionData.totalCount
            })}
          />
          {sectionEntries.map(({ entry, index }) => {
            const itemMetadata = entry.item.metadata
            const thumbnailUrl = itemMetadata?.imageUrl

            let subtitle: string | undefined = itemMetadata?.subtitle
            if (entry.item.section === 'products') {
              const parts: string[] = []
              const packInfo =
                itemMetadata?.canonicalPack ||
                (itemMetadata?.packSizes && itemMetadata.packSizes.length > 0
                  ? itemMetadata.packSizes[0]
                  : undefined)
              if (packInfo) parts.push(packInfo)
              if (itemMetadata?.subtitle) parts.push(itemMetadata.subtitle)
              subtitle = parts.length > 0 ? parts.join(' • ') : undefined
            }

            if (entry.item.section === 'products') {
              return (
                <ProductDialogRow
                  key={entry.item.id}
                  item={entry.item}
                  subtitle={subtitle}
                  thumbnailUrl={thumbnailUrl}
                  badge={metadata.badge}
                  sectionLabel={shouldShowMeta ? metadata.meta : undefined}
                  active={activeIndex === index}
                  onHover={() => onHoverIndex(index)}
                  onSelect={() => onEntrySelect(entry)}
                />
              )
            }

            const metaIndicator = shouldShowMeta ? (
              <SectionIndicator icon={metadata.icon} label={metadata.meta} />
            ) : undefined

            return (
              <DialogRow
                key={entry.item.id}
                title={entry.item.name}
                subtitle={subtitle}
                meta={metaIndicator}
                thumbnailUrl={thumbnailUrl}
                icon={!thumbnailUrl ? <DialogBadge>{metadata.badge}</DialogBadge> : undefined}
                active={activeIndex === index}
                onHover={() => onHoverIndex(index)}
                onSelect={() => onEntrySelect(entry)}
              />
            )
          })}
          {sectionData.hasMore && (
            <div className="px-3 pt-3">
              <button
                onClick={() => onViewAll(section, trimmedQuery)}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[color:var(--text)] transition-all duration-150 ease-out hover:border-[rgba(245,158,11,0.35)] hover:bg-[rgba(245,158,11,0.14)]"
              >
                <span>
                  {t('actions.viewAll', {
                    count: sectionData.totalCount,
                    section: metadata.heading.toLowerCase()
                  })}
                </span>
                <span className="text-[color:var(--brand-accent)] transition-colors group-hover:text-[color:var(--text)]">↗</span>
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

  return <div className="space-y-2 pb-2">{sectionsContent}</div>
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
        'group flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2.5 text-left transition-colors duration-150 ease-out',
        active
          ? 'bg-white/[0.10] text-[color:var(--text)] shadow-[0_0_0_1px_rgba(255,255,255,0.16)]'
          : 'text-[color:var(--text-subtle)] hover:bg-white/[0.05]'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-medium transition-opacity',
          active ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'
        )}
      >
        ↺
      </span>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate text-[14px] font-medium transition-colors',
            active ? 'text-[color:var(--text)]' : 'text-current group-hover:text-[color:var(--text)]'
          )}
        >
          {query}
        </div>
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
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full text-[12px] transition-colors',
          active ? 'text-[color:var(--text)] hover:text-[color:var(--text)]' : 'text-[color:var(--text-subtle)] hover:text-[color:var(--text)]'
        )}
        aria-label={`Remove ${query} from recent searches`}
      >
        ✕
      </button>
    </div>
  )
}

function DialogSection({ label }: { label: string }) {
  return (
    <div className="px-4 pt-2">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)] opacity-80">
        {label}
      </div>
      <div className="h-px bg-white/10" />
    </div>
  )
}

interface DialogRowProps {
  title: string
  subtitle?: string
  meta?: React.ReactNode
  icon?: React.ReactNode
  thumbnailUrl?: string
  action?: React.ReactNode
  active: boolean
  onHover: () => void
  onSelect: () => void
}

function DialogRow({
  title,
  subtitle,
  meta,
  icon,
  thumbnailUrl,
  action,
  active,
  onHover,
  onSelect,
}: DialogRowProps) {
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
        'grid w-full grid-cols-[56px,1fr,auto] items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[color:var(--text)] transition-all duration-150 ease-out',
        active ? 'bg-white/[0.1] ring-1 ring-inset ring-white/12' : 'hover:bg-white/[0.06]'
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
        {thumbnailUrl ? (
          <LazyImage
            src={thumbnailUrl}
            alt={title}
            loading="lazy"
            className="h-12 w-12 overflow-hidden rounded-[10px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-raised)]"
            imgClassName="h-full w-full object-cover"
          />
        ) : (
          icon ?? <DialogBadge>{title.charAt(0).toUpperCase()}</DialogBadge>
        )}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {subtitle && (
          <div className="truncate text-[13px] text-[color:var(--text-muted)]">{subtitle}</div>
        )}
      </div>
      <div
        className={cn(
          'flex h-full items-end justify-end gap-3',
          meta || action ? 'pl-3' : 'pl-0',
        )}
      >
        {typeof meta === 'string' ? (
          <span className="text-[13px] text-[color:var(--text-muted)]">{meta}</span>
        ) : (
          meta
        )}
        {action}
      </div>
    </button>
  )
}

interface ProductDialogRowProps {
  item: SearchResultItem
  subtitle?: string
  thumbnailUrl?: string
  badge?: string
  sectionLabel?: string
  active: boolean
  onHover: () => void
  onSelect: () => void
}

function ProductDialogRow({
  item,
  subtitle,
  thumbnailUrl,
  badge,
  sectionLabel,
  active,
  onHover,
  onSelect,
}: ProductDialogRowProps) {
  const metadata = item.metadata ?? {}
  const priceLabel = metadata.price ?? null
  const availabilityStatus = metadata.availabilityStatus ?? null
  const availabilityText = metadata.availability ?? null

  const rawNames = metadata.supplierNames ?? metadata.supplierIds ?? []
  const entries = rawNames.length > 0
    ? rawNames.map((name, index) => ({
        name,
        logoUrl: metadata.supplierLogos?.[index] ?? null,
      }))
    : (metadata.supplierLogos ?? []).map((logo, index) => ({
        name: `Supplier ${index + 1}`,
        logoUrl: logo,
      }))

  const derivedSupplierCount =
    typeof metadata.supplierCount === 'number' && metadata.supplierCount > 0
      ? metadata.supplierCount
      : entries.length

  const previewEntries = entries.slice(0, 3)
  const overflowCount = Math.max(0, derivedSupplierCount - previewEntries.length)
  const summaryLabel =
    derivedSupplierCount > 1
      ? `${derivedSupplierCount} suppliers`
      : entries[0]?.name ?? null

  const showAvailabilityBadge = Boolean(availabilityStatus)
  const fallbackAvailabilityLabel = !availabilityStatus && availabilityText ? availabilityText : null
  const showMetaRow =
    showAvailabilityBadge || Boolean(fallbackAvailabilityLabel) || entries.length > 0

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
        'grid w-full grid-cols-[56px,1fr,auto] items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[color:var(--text)] transition-all duration-150 ease-out',
        active ? 'bg-white/[0.1] ring-1 ring-inset ring-white/12' : 'hover:bg-white/[0.06]'
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
        {thumbnailUrl ? (
          <LazyImage
            src={thumbnailUrl}
            alt={item.name}
            loading="lazy"
            className="h-12 w-12 overflow-hidden rounded-[10px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-raised)]"
            imgClassName="h-full w-full object-cover"
          />
        ) : (
          <DialogBadge>{badge ?? item.name.charAt(0).toUpperCase()}</DialogBadge>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {sectionLabel && (
                <span className="inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--text-muted)]">
                  {sectionLabel}
                </span>
              )}
              <span className="truncate text-[15px] font-semibold">{item.name}</span>
            </div>
            {subtitle && (
              <div className="truncate text-[13px] text-[color:var(--text-muted)]">{subtitle}</div>
            )}
          </div>
          {priceLabel && (
            <span className="shrink-0 whitespace-nowrap text-[13px] font-semibold text-[color:var(--text)]">
              {priceLabel}
            </span>
          )}
        </div>
        {showMetaRow && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[color:var(--text-muted)]">
            {showAvailabilityBadge ? (
              <AvailabilityBadge
                status={availabilityStatus ?? undefined}
                className="!h-6 !rounded-full !px-2 text-[11px] opacity-80"
              />
            ) : fallbackAvailabilityLabel ? (
              <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-2 py-1 font-medium text-[color:var(--text-muted)]">
                {fallbackAvailabilityLabel}
              </span>
            ) : null}
            {entries.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {previewEntries.map((entry, index) => (
                    <SupplierLogo
                      key={`${entry.name}-${index}`}
                      name={entry.name}
                      logoUrl={entry.logoUrl}
                      className="!h-5 !w-5 !rounded-full border border-white/10 bg-white/10 opacity-80"
                    />
                  ))}
                  {overflowCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[10px] font-semibold text-[color:var(--text)] opacity-70">
                      +{overflowCount}
                    </span>
                  )}
                </div>
                {summaryLabel && (
                  <span className="max-w-[140px] truncate opacity-80">{summaryLabel}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex h-full items-center justify-end">
        <ProductQuickAddButton item={item} />
      </div>
    </button>
  )
}

function SectionIndicator({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
}) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-[color:var(--button-primary)] ring-1 ring-inset ring-[color:var(--button-primary)]/40">
      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  )
}

function DialogBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-[color:var(--surface-ring)] bg-white/[0.08] text-[13px] font-semibold uppercase text-[color:var(--text-muted)]">
      {children}
    </div>
  )
}

function ProductQuickAddButton({ item }: { item: SearchResultItem }) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const [isAdding, setIsAdding] = useState(false)

  const supplierIds = item.metadata?.supplierIds ?? []
  if (!supplierIds || supplierIds.length === 0) return null
  const supplierNames = item.metadata?.supplierNames ?? []
  const primarySupplierId = supplierIds[0]
  if (!primarySupplierId) return null

  const existingItem = items.find((cartItem) => cartItem.supplierItemId === item.id)

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  if (existingItem) {
    return (
      <div
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        onTouchStart={stopPropagation}
        onClick={stopPropagation}
        className="flex items-center"
      >
        <QuantityStepper
          quantity={existingItem.quantity}
          onChange={(qty) => updateQuantity(existingItem.supplierItemId, qty)}
          onRemove={() => removeItem(existingItem.supplierItemId)}
          label={item.name}
          supplier={existingItem.supplierName}
        />
      </div>
    )
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (isAdding) return
    setIsAdding(true)

    try {
      const supplierName = supplierNames[0] ?? primarySupplierId
      const packInfo =
        item.metadata?.canonicalPack ||
        (item.metadata?.packSizes && item.metadata.packSizes.length > 0
          ? item.metadata.packSizes[0]
          : 'Pack')
      const priceValue =
        typeof item.metadata?.priceValue === 'number' ? item.metadata.priceValue : null

      addItem(
        {
          id: item.id,
          supplierId: primarySupplierId,
          supplierName,
          itemName: item.name,
          sku: item.id,
          packSize: packInfo,
          packPrice: priceValue,
          unitPriceExVat: priceValue,
          unitPriceIncVat: priceValue,
          vatRate: 0,
          unit: 'unit',
          supplierItemId: item.id,
          displayName: item.name,
          packQty: 1,
          image: item.metadata?.imageUrl ?? null,
        },
        1,
      )
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      onPointerDown={stopPropagation}
      onMouseDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onTouchStart={stopPropagation}
      onClick={handleClick}
      disabled={isAdding}
      className="!h-8 !px-3 rounded-full text-sm font-semibold shadow-[0_16px_36px_-24px_rgba(11,91,211,0.7)]"
    >
      {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
    </Button>
  )
}

