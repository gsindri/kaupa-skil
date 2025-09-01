import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer select-none",
  {
    variants: {
      color: {
        default:
          "border-input text-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary",
        green:
          "border-green-600 text-green-600 data-[selected=true]:bg-green-500 data-[selected=true]:text-white data-[selected=true]:border-green-500",
        orange:
          "border-orange-600 text-orange-600 data-[selected=true]:bg-orange-500 data-[selected=true]:text-white data-[selected=true]:border-orange-500",
      },
    },
    defaultVariants: {
      color: "default",
    },
  }
)

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof filterChipVariants> {
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    { selected = false, onSelectedChange, color, className, children, ...props },
    ref
  ) => (
    <button
      type="button"
      ref={ref}
      key={String(selected)}
      data-selected={selected}
      onClick={() => onSelectedChange?.(!selected)}
      className={cn(
        filterChipVariants({ color }),
        "animate-chip-bounce",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)

FilterChip.displayName = "FilterChip"

export { FilterChip }

