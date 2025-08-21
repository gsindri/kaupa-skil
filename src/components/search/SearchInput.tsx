import React from 'react'
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
    return (
      <div className="relative">
        {isLoading ? (
          <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-muted border-t-primary" />
        ) : (
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          ref={ref}
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
            'h-10 w-40 rounded-full border pl-9 pr-8 transition-all duration-200 ease-in-out focus:outline-none',
            expanded ? 'w-72 shadow-md' : 'w-40'
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

