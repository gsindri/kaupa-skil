
import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useOptimizedSupplierItems } from '@/hooks/useOptimizedSupplierItems'
import { useDebounce } from '@/hooks/useDebounce'

interface QuickSearchProps {
  onItemSelect?: (item: any) => void
  placeholder?: string
  className?: string
}

export function QuickSearch({ onItemSelect, placeholder = "Search items...", className }: QuickSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const { data: items = [], isLoading } = useOptimizedSupplierItems({
    search: debouncedSearch,
    limit: 10
  })

  const handleClear = () => {
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {searchTerm && (
        <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-muted-foreground">Searching...</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No items found</div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => onItemSelect?.(item)}
                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium text-sm">{item.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  SKU: {item.ext_sku}
                  {item.brand && ` • ${item.brand}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
