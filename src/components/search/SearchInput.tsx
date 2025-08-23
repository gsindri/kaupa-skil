import React, { useRef, useImperativeHandle } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  expanded: boolean
  onClear: () => void
  isLoading: boolean
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onFocus,
      onBlur,
      onKeyDown,
      expanded,
      onClear,
      isLoading
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    return (
      <div className="relative" style={{ contain: 'layout paint' }}>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            inputRef.current?.focus()
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 cursor-text text-muted-foreground"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={expanded}
          aria-controls="global-search-results"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder="Search products, suppliers, orders..."
          className={cn(
            'h-10 w-full rounded-full border border-border bg-background pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50',
            expanded && 'shadow-md'
          )}
        />
        {!expanded && !value && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/</span>
        )}
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

