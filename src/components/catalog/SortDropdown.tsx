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
            'inline-flex h-[var(--ctrl-h,40px)] items-center gap-3 rounded-[var(--ctrl-r,12px)] border border-transparent bg-[color:var(--chip-bg)] px-3 text-sm font-semibold text-[color:var(--ink-hi)] backdrop-blur-xl transition duration-200 ease-out focus-visible:outline-none hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] motion-reduce:transition-none',
            className,
          )}
          aria-label={`Sort by ${label}`}
          title={label}
        >
          <Sparkle size={24} weight="fill" className="text-[color:var(--ink-hi)]" aria-hidden="true" />
          <span className="truncate">{label}</span>
          <CaretDown size={20} weight="fill" className="text-[color:var(--ink-hi)]/70" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={12}
        className="w-[240px] rounded-[16px] bg-[color:var(--field-bg-elev)] p-2 text-[color:var(--ink)] ring-1 ring-inset ring-white/12 shadow-[0_18px_40px_rgba(3,10,26,0.45)] backdrop-blur-xl"
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

