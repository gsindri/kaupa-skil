import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-7 items-center rounded-pill border px-3 text-sm font-medium transition-colors duration-[var(--dur-fast)] ease-[var(--ease-snap)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] cursor-pointer select-none border-input text-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary motion-reduce:transition-none"
)

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  animation?: string
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    { selected = false, onSelectedChange, animation = "animate-chip-bounce", className, children, ...props },
    ref
  ) => (
    <button
      type="button"
      ref={ref}
      key={String(selected)}
      data-selected={selected}
      onClick={() => onSelectedChange?.(!selected)}
      className={cn(filterChipVariants(), animation, className)}
      {...props}
    >
      {children}
    </button>
  )
)

FilterChip.displayName = "FilterChip"

export { FilterChip }

