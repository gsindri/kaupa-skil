import * as React from "react"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-7 items-center rounded-pill border px-3 text-sm font-medium transition-colors duration-fast ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)] cursor-pointer select-none border-input text-foreground data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:border-primary motion-reduce:transition-none"
)

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  animation?: string
  onRemove?: () => void
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    {
      selected = false,
      onSelectedChange,
      animation = "animate-chip-bounce",
      className,
      children,
      onRemove,
      onClick,
      ...props
    },
    ref
  ) => {
    const removeLabel =
      typeof children === "string" ? `Remove ${children}` : "Remove filter"

    const handleRemove = (
      e: React.MouseEvent<HTMLSpanElement> | React.KeyboardEvent<HTMLSpanElement>
    ) => {
      e.stopPropagation()
      e.preventDefault()
      onRemove?.()
    }

    const handleRemoveKeyDown = (
      e: React.KeyboardEvent<HTMLSpanElement>
    ) => {
      if (e.key === "Enter" || e.key === " ") {
        handleRemove(e)
      }
    }

    return (
      <button
        type="button"
        ref={ref}
        key={String(selected)}
        data-selected={selected}
        onClick={(e) => {
          onSelectedChange?.(!selected)
          onClick?.(e)
        }}
        className={cn(filterChipVariants(), animation, className)}
        {...props}
      >
        {children}
        {selected && onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label={removeLabel}
            className="ml-1 rounded p-0.5 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            onClick={handleRemove as any}
            onKeyDown={handleRemoveKeyDown}
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>
    )
  }
)

FilterChip.displayName = "FilterChip"

export { FilterChip }

