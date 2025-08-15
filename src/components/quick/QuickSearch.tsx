
import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { useSupplierItems } from '@/hooks/useSupplierItems'

interface QuickSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onResultSelect?: (item: any) => void
}

export function QuickSearch({ 
  value, 
  onChange, 
  placeholder = "Search item / brand / EAN…",
  onResultSelect 
}: QuickSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [showResults, setShowResults] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  
  const debouncedSearch = useDebounce(value, 250)
  const { data: supplierItems = [] } = useSupplierItems()

  // Filter results based on debounced search
  const searchResults = React.useMemo(() => {
    if (!debouncedSearch.trim()) return []
    
    const query = debouncedSearch.toLowerCase()
    return supplierItems
      .filter(item => 
        item.display_name?.toLowerCase().includes(query) ||
        item.ext_sku?.toLowerCase().includes(query) ||
        item.ean?.toLowerCase().includes(query)
      )
      .slice(0, 8) // Limit to 8 results for clean dropdown
  }, [supplierItems, debouncedSearch])

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle keyboard navigation in results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && searchResults[focusedIndex]) {
          handleResultSelect(searchResults[focusedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setFocusedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleResultSelect = (item: any) => {
    setShowResults(false)
    setFocusedIndex(-1)
    onChange('')
    onResultSelect?.(item)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowResults(true)}
        onBlur={() => {
          // Delay hiding to allow result clicks
          setTimeout(() => setShowResults(false), 150)
        }}
        onKeyDown={handleKeyDown}
        className="h-11 rounded-lg pl-10 text-base focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:shadow-focus transition-all duration-200"
      />
      
      {/* Inline Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-foreground/10 shadow-lg max-h-[440px] overflow-y-auto z-50 animate-scale-in"
        >
          {searchResults.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleResultSelect(item)}
              className={`w-full px-4 py-3 text-left hover:bg-muted/50 border-b border-foreground/5 last:border-0 transition-colors duration-150 ${
                index === focusedIndex ? 'bg-muted/50' : ''
              }`}
              style={{
                animationDelay: `${index * 20}ms`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {item.display_name}
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {(item as any).supplier?.name || 'Unknown Supplier'}
                    </span>
                    {item.pack_qty && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {item.pack_qty} {(item as any).pack_unit?.code || 'units'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-sm text-foreground" style={{ fontFeatureSettings: '"tnum" 1' }}>
                    {item.ext_sku}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading indicator for search */}
      {debouncedSearch !== value && value.trim() && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
