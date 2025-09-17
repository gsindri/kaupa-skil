import React from 'react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import {
  CaretDown,
  Sparkle,
  ArrowDown,
  ArrowUp,
  TextAa,
  ClockClockwise,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/state/catalogFiltersStore'

const labels: Record<SortOrder, string> = {
  relevance: 'Relevance',
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
  az: 'A–Z',
  recent: 'Recently ordered',
}

interface SortDropdownProps {
  value: SortOrder
  onChange: (s: SortOrder) => void
  className?: string
  onOpenChange?: (open: boolean) => void
}

export function SortDropdown({ value, onChange, className, onOpenChange }: SortDropdownProps) {
  const label = labels[value]

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-[var(--ctrl-h,40px)] items-center gap-2 rounded-[var(--ctrl-r,12px)] px-3 text-sm font-medium text-[color:var(--ink-dim)] ring-1 ring-inset ring-white/12 transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--toolbar-bg)] hover:bg-white/10 hover:text-[color:var(--ink)] hover:ring-white/20 motion-reduce:transition-none',
            className,
          )}
          aria-label={`Sort by ${label}`}
        >
          <span className="truncate">{label}</span>
          <CaretDown size={16} weight="bold" className="text-[color:var(--ink-dim)]/80" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={12}
        className="w-[240px] rounded-[16px] border border-white/10 bg-[var(--field-bg-elev)]/95 p-2 text-[color:var(--ink)] shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--ink-dim)]/80">
          Sort items
        </DropdownMenuLabel>

        <DropdownMenuRadioGroup value={value} onValueChange={v => onChange(v as SortOrder)}>
          <DropdownMenuRadioItem value="relevance" className="group flex items-start gap-3 rounded-[var(--ctrl-r,12px)] px-3 py-2 text-sm text-[color:var(--ink)] data-[state=checked]:bg-white/10">
            <Sparkle size={18} weight="duotone" className="mt-0.5 shrink-0 text-[color:var(--ink)]/80" />
            <div className="min-w-0">
              <div className="font-medium">Relevance</div>
              <div className="text-xs text-[color:var(--ink-dim)]/80">Best match for your search</div>
            </div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator className="my-2 border-white/10" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wide text-[color:var(--ink-dim)]/70">
            By price
          </DropdownMenuLabel>

          <DropdownMenuRadioItem value="price_asc" className="flex items-center gap-3 rounded-[var(--ctrl-r,12px)] px-3 py-2 text-sm data-[state=checked]:bg-white/10">
            <ArrowDown size={18} weight="duotone" className="shrink-0 text-[color:var(--ink)]/80" />
            <span>Price: Low → High</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="price_desc" className="flex items-center gap-3 rounded-[var(--ctrl-r,12px)] px-3 py-2 text-sm data-[state=checked]:bg-white/10">
            <ArrowUp size={18} weight="duotone" className="shrink-0 text-[color:var(--ink)]/80" />
            <span>Price: High → Low</span>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator className="my-2 border-white/10" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wide text-[color:var(--ink-dim)]/70">
            Other
          </DropdownMenuLabel>

          <DropdownMenuRadioItem value="az" className="flex items-center gap-3 rounded-[var(--ctrl-r,12px)] px-3 py-2 text-sm data-[state=checked]:bg-white/10">
            <TextAa size={18} weight="duotone" className="shrink-0 text-[color:var(--ink)]/80" />
            <span>A–Z</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="recent" className="flex items-center gap-3 rounded-[var(--ctrl-r,12px)] px-3 py-2 text-sm data-[state=checked]:bg-white/10">
            <ClockClockwise size={18} weight="duotone" className="shrink-0 text-[color:var(--ink)]/80" />
            <span>Recently ordered</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <div className="mt-2 px-2 pt-1 text-[10px] text-[color:var(--ink-dim)]/70">
          Tip: use ↑ ↓ and Enter
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SortDropdown

