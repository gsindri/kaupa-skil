import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortOrder } from '@/state/catalogFilters'

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low \u2192 High' },
  { value: 'price_desc', label: 'Price: High \u2192 Low' },
  { value: 'az', label: 'A\u2013Z' },
  { value: 'recent', label: 'Recently ordered' },
]

interface AnimatedSortDropdownProps {
  value: SortOrder
  onValueChange: (v: SortOrder) => void
}

export function AnimatedSortDropdown({ value, onValueChange }: AnimatedSortDropdownProps) {
  const label = SORT_OPTIONS.find(opt => opt.value === value)?.label || 'Sort'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-40 justify-between"
          aria-label="Sort items"
        >
          {label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-2">
        <DropdownMenuRadioGroup value={value} onValueChange={v => onValueChange(v as SortOrder)}>
          {SORT_OPTIONS.map(opt => (
            <DropdownMenuRadioItem
              key={opt.value}
              value={opt.value}
              className={cn(
                'group p-0 py-0 pl-0 pr-0 focus:bg-transparent focus:text-inherit data-[state=checked]:bg-transparent [&>span]:hidden'
              )}
            >
              <Card
                className={cn(
                  'cursor-pointer p-3 text-sm transition-all group-data-[state=checked]:ring-2 group-data-[state=checked]:ring-primary'
                )}
              >
                {opt.label}
              </Card>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AnimatedSortDropdown
