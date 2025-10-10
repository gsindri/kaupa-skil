import * as React from "react"
import { cva } from "class-variance-authority"
import { X, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const filterChipVariants = cva(
  "inline-flex h-[var(--ctrl-h,36px)] items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--ctrl-r,12px)] border px-3 text-sm font-medium transition-all duration-[140ms] ease-out backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 cursor-pointer select-none motion-reduce:transition-none hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        include: "border-[color:var(--accent-fill)]/60 bg-[color:var(--accent-fill)]/15 text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-fill)]/25",
        exclude: "border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20",
        default: "border-[color:var(--ring-idle)]/60 bg-white/70 text-[color:var(--ink-dim)] hover:bg-white/85 hover:text-[color:var(--ink)] hover:border-[color:var(--ring-hover)]",
        boolean: "border-[color:var(--accent-fill)]/50 bg-[color:var(--accent-fill)]/20 text-[color:var(--accent-ink)] hover:bg-[color:var(--accent-fill)]/30",
        range: "border-[color:var(--ring-idle)]/60 bg-white/80 text-[color:var(--ink)] hover:bg-white hover:border-[color:var(--ring-hover)]",
        multi: "border-[color:var(--ring-idle)]/60 bg-white/80 text-[color:var(--ink)] hover:bg-white hover:border-[color:var(--ring-hover)]",
        text: "border-[color:var(--ring-idle)]/60 bg-white/80 text-[color:var(--ink)] hover:bg-white hover:border-[color:var(--ring-hover)]"
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
  variant?: 'include' | 'exclude' | 'default' | 'boolean' | 'range' | 'multi' | 'text'
  onCycle?: () => void
  onSelectedChange?: (selected: boolean) => void
  animation?: string
  onRemove?: () => void
  onEdit?: () => void
  hasPopover?: boolean
  summary?: string
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
      onEdit,
      hasPopover = false,
      summary,
      onClick,
      ...props
    },
    ref
  ) => {
    const removeLabel =
      typeof children === "string" ? `Remove filter: ${children}` : "Remove filter"
    const editLabel =
      typeof children === "string" ? `Edit filter: ${children}` : "Edit filter"

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // If has popover and edit handler, open popover on main click
      if (hasPopover && onEdit) {
        onEdit()
      } else if (onCycle) {
        onCycle()
      } else {
        onSelectedChange?.(!selected)
      }
      onClick?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      // Backspace/Delete removes the chip
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        onRemove?.()
      }
      // Enter opens popover if available
      if (e.key === 'Enter' && hasPopover && onEdit) {
        e.preventDefault()
        onEdit()
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
        title={summary || (variant === 'exclude' ? 'Excluded' : undefined)}
        aria-label={hasPopover ? editLabel : removeLabel}
        {...props}
      >
        {variant === 'exclude' && <span aria-hidden="true">−</span>}
        <span className="truncate max-w-[200px]">{children}</span>
        
        {hasPopover && (
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
        )}
        
        {onRemove && (
          <span
            role="button"
            tabIndex={-1}
            aria-label={removeLabel}
            className="ml-0.5 rounded-full p-0.5 text-[color:var(--ink-dim)]/70 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
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

