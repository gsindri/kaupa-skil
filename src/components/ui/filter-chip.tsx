import * as React from "react"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-[var(--ctrl-h,40px)] items-center justify-center whitespace-nowrap rounded-[var(--ctrl-r,12px)] px-3 text-sm font-semibold text-[color:var(--ink)] ring-1 ring-inset ring-[color:var(--ring-idle)] bg-[color:var(--chip-bg)] transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--toolbar-bg)] cursor-pointer select-none hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] hover:ring-[color:var(--ring-hover)] motion-reduce:transition-none data-[selected=true]:bg-[color:var(--seg-active-bg)] data-[selected=true]:text-[color:var(--ink-hi)] data-[selected=true]:ring-[color:var(--ring-hover)]"
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
            className="ml-1 rounded-full p-1 text-[color:var(--ink)]/80 transition-colors hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink-hi)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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

