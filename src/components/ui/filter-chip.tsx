import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer select-none border-input text-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary"
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

