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
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ArrowDown01,
  ArrowUp01,
  ArrowDownAZ,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/state/catalogFilters'

const labels: Record<SortOrder, string> = {
  relevance: 'Relevance',
  price_asc: 'Price: Low \u2192 High',
  price_desc: 'Price: High \u2192 Low',
  az: 'A\u2013Z',
  recent: 'Recently ordered',
}

interface SortDropdownProps {
  value: SortOrder
  onChange: (s: SortOrder) => void
  className?: string
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const label = labels[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 rounded-xl px-3', className)}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className="w-[220px] rounded-xl shadow-lg border p-2"
      >
        <DropdownMenuLabel className="px-2 pb-1 text-xs text-muted-foreground">
          Sort items
        </DropdownMenuLabel>

        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortOrder)}>
          <DropdownMenuRadioItem value="relevance" className="rounded-lg py-2 pl-8 pr-2 flex items-start">
            <Sparkles className="mr-2 h-4 w-4 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm">Relevance</div>
              <div className="text-xs text-muted-foreground">Best match for your search</div>
            </div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            By price
          </DropdownMenuLabel>

          <DropdownMenuRadioItem value="price_asc" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <ArrowDown01 className="mr-2 h-4 w-4" />
            <div className="text-sm">Price: Low \u2192 High</div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="price_desc" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <ArrowUp01 className="mr-2 h-4 w-4" />
            <div className="text-sm">Price: High \u2192 Low</div>
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Other
          </DropdownMenuLabel>

          <DropdownMenuRadioItem value="az" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            <div className="text-sm">A\u2013Z</div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="recent" className="rounded-lg py-2 pl-8 pr-2 flex items-center">
            <History className="mr-2 h-4 w-4" />
            <div className="text-sm">Recently ordered</div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <div className="mt-2 px-2 pt-1 text-[10px] text-muted-foreground">
          Tip: use \u2191 \u2193 and Enter
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default SortDropdown

