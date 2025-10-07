import * as React from "react"
import { cva } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-[var(--ctrl-h,36px)] items-center justify-center gap-1 whitespace-nowrap rounded-[var(--ctrl-r,12px)] border px-3 text-sm font-medium transition duration-150 ease-out backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-3 focus-visible:ring-offset-[color:var(--toolbar-bg)] cursor-pointer select-none motion-reduce:transition-none",
  {
    variants: {
      variant: {
        include: "border-[color:var(--accent-fill)]/60 bg-[color:var(--accent-fill)]/15 text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-fill)]/25",
        exclude: "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20",
        default: "border-[color:var(--ring-idle)]/60 bg-white/70 text-[color:var(--ink-dim)] hover:bg-white/85 hover:text-[color:var(--ink)] hover:border-[color:var(--ring-hover)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

export interface FilterChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  variant?: 'include' | 'exclude' | 'default'
  onCycle?: () => void
  onSelectedChange?: (selected: boolean) => void
  animation?: string
  onRemove?: () => void
}

const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  (
    {
      selected = false,
      variant = 'default',
      onSelectedChange,
      onCycle,
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

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onCycle) {
        onCycle()
      } else {
        onSelectedChange?.(!selected)
      }
      onClick?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if ((e.key === 'Backspace' || e.key === 'Delete') && onCycle) {
        e.preventDefault()
        // Trigger remove by cycling to the end
        if (variant === 'exclude') {
          onCycle() // exclude → remove
        } else if (variant === 'include') {
          onCycle() // include → exclude
          setTimeout(() => onCycle && onCycle(), 0) // exclude → remove
        }
      }
    }

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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(filterChipVariants({ variant }), animation, className)}
        title={variant === 'exclude' ? 'Excluded' : undefined}
        {...props}
      >
        {variant === 'exclude' && <span aria-hidden="true">−</span>}
        {children}
        {selected && onRemove && (
          <span
            role="button"
            tabIndex={0}
            aria-label={removeLabel}
            data-selected={selected}
            className="ml-1 rounded-full p-1 text-[color:var(--ink-dim)]/80 transition-colors hover:bg-white/70 hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent data-[selected=true]:text-[color:var(--accent-ink)]/80 data-[selected=true]:hover:text-[color:var(--accent-ink)] data-[selected=true]:focus-visible:ring-offset-[color:var(--accent-fill)]"
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

