import React from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command'
import type { FacetFilters } from '@/services/catalog'

interface CatalogCommandPaletteProps {
  onApply: (filters: Partial<FacetFilters> & { search?: string }) => void
}

const TABS = [
  { id: 'all', label: 'All', placeholder: 'Search products, suppliers, orders…' },
  { id: 'products', label: 'Products', placeholder: 'Search products by name or code…' },
  { id: 'suppliers', label: 'Suppliers', placeholder: 'Search suppliers by name…' },
  { id: 'orders', label: 'Orders', placeholder: 'Search orders by PO, supplier, or status…' },
] as const

type TabId = (typeof TABS)[number]['id']

type TokenKey = 'supplier' | 'brand' | 'category'

export function CatalogCommandPalette({ onApply }: CatalogCommandPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')
  const [activeTab, setActiveTab] = React.useState<TabId>('all')

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSubmit = React.useCallback(
    (input: string) => {
      const result: Partial<FacetFilters> & { search?: string } = {}
      let text = input

      const tokenRegex = /(supplier|brand|category):([^\s]+)/gi
      let match: RegExpExecArray | null
      while ((match = tokenRegex.exec(input)) !== null) {
        const [, key, raw] = match
        const normalized = key.toLowerCase() as TokenKey
        const existing = (result[normalized] as string[] | undefined) ?? []
        result[normalized] = [...existing, raw]
        text = text.replace(match[0], '')
      }

      const free = text.trim()
      if (free) {
        result.search = free
      }

      onApply(result)
      setOpen(false)
      setValue('')
    },
    [onApply],
  )

  const placeholder = React.useMemo(() => {
    return TABS.find(tab => tab.id === activeTab)?.placeholder ?? TABS[0].placeholder
  }, [activeTab])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      contentProps={{
        className: '[&>div:first-child]:hidden [&>[data-radix-dialog-close]]:hidden',
      }}
    >
      <div className="h-[3px] w-full rounded-t-[16px] bg-[color:var(--brand-accent)]" />

      <div className="p-3 pb-2">
        <div className="flex h-14 items-center gap-3 rounded-[14px] border border-[color:var(--surface-ring)] bg-[color:var(--surface-pop)] px-4">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="opacity-80">
            <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
          </svg>
          <CommandInput
            autoFocus
            value={value}
            onValueChange={setValue}
            placeholder={placeholder}
            className="h-full border-0 bg-transparent text-[15px]"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit(value)
              }
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-w-9 h-9 rounded-full px-2 text-[14px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-accent)] focus-visible:ring-offset-0"
          >
            ✕
            <span className="sr-only">Close search</span>
          </button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="grid h-11 grid-cols-4 gap-1 rounded-[12px] border border-[color:var(--surface-ring)] p-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-[10px] text-[14px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-accent)] focus-visible:ring-offset-0 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-[color:var(--text)]'
                  : 'text-[color:var(--text-muted)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <CommandList className="flex-1 overflow-y-auto pb-4 pt-1">
        <CommandEmpty className="px-4 py-6 text-left text-[14px] text-[color:var(--text-muted)]">
          No results. Try a product name or supplier.
        </CommandEmpty>

        <Section label="Recent searches" />
        <Row
          title="supplier:innnes category:dairy"
          subtitle="Saved supplier + category filter"
          meta="Filter"
          value="supplier:innnes category:dairy"
          onSelect={() => handleSubmit('supplier:innnes category:dairy')}
        />
        <Row
          title="brand:hjartalag"
          subtitle="Focus on one brand"
          meta="Filter"
          value="brand:hjartalag"
          onSelect={() => handleSubmit('brand:hjartalag')}
        />

        <Section label="Suggestions" />
        <Row
          title="Eggs (12-pack, free-range)"
          subtitle="SKU 384920"
          meta="Product · 1.890 kr"
          icon={<Badge>EG</Badge>}
          onSelect={() => handleSubmit('Eggs (12-pack, free-range)')}
        />
        <Row
          title="Eimskip Food Service"
          subtitle="Primary Reykjavík supplier"
          meta="Supplier"
          icon={<Badge>E</Badge>}
          onSelect={() => handleSubmit('supplier:eimskip-food-service')}
        />

        <Section label="Results" />
        {/* Map live results to <Row /> when available */}
      </CommandList>
    </CommandDialog>
  )
}

function Section({ label }: { label: string }) {
  return (
    <div className="px-4 pt-3">
      <div className="mb-2 text-[12px] font-medium tracking-[0.08em] text-[color:var(--text-muted)]">
        {label}
      </div>
      <div className="h-px bg-[color:var(--surface-ring)]" />
    </div>
  )
}

interface RowProps {
  title: string
  subtitle?: string
  meta?: string
  value?: string
  icon?: React.ReactNode
  onSelect?: () => void
}

function Row({ title, subtitle, meta, value, icon, onSelect }: RowProps) {
  const initials = title.trim().slice(0, 2).toUpperCase() || '•'
  const fallback = (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[13px] font-medium text-[color:var(--text)] opacity-80">
      {initials}
    </div>
  )

  return (
    <CommandItem value={value ?? title} onSelect={onSelect ? () => onSelect() : undefined} asChild>
      <div className="grid h-14 grid-cols-[32px,1fr,auto] items-center gap-3 rounded-[12px] px-4 transition-colors hover:bg-white/6 data-[selected=true]:bg-white/10 data-[selected=true]:text-[color:var(--text)]">
        <div className="flex items-center justify-center">
          {icon ?? fallback}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold">{title}</div>
          {subtitle && (
            <div className="truncate text-[13px] text-[color:var(--text-muted)]">{subtitle}</div>
          )}
        </div>
        <div className="pl-3 text-right text-[13px] text-[color:var(--text-muted)]">
          {meta ?? ''}
        </div>
      </div>
    </CommandItem>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[13px] font-medium text-[color:var(--text)] opacity-80">
      {children}
    </div>
  )
}

export default CatalogCommandPalette
