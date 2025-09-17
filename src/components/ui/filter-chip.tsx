import * as React from "react"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-[var(--ctrl-h,40px)] items-center justify-center rounded-[var(--ctrl-r,12px)] border border-white/10 bg-white/0 px-3 text-sm font-medium text-[color:var(--ink-dim)] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent cursor-pointer select-none hover:bg-white/6 hover:text-[color:var(--ink)] motion-reduce:transition-none data-[selected=true]:border-white/20 data-[selected=true]:bg-white/12 data-[selected=true]:text-[color:var(--ink)]"
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
            className="ml-1 rounded-full p-1 text-[color:var(--ink-dim)] transition-colors hover:bg-white/10 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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

