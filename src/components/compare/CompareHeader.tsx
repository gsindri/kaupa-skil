
import React from 'react'
import { Search, Filter, Settings } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import VatToggle from '@/components/ui/VatToggle'
import { useSettings } from '@/contexts/useSettings'

interface CompareHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  onFiltersClick: () => void
  activeFilters: number
}

export function CompareHeader({ 
  searchTerm, 
  onSearchChange, 
  onFiltersClick,
  activeFilters 
}: CompareHeaderProps) {
  const { includeVat, setIncludeVat, preferredUnit, setPreferredUnit } = useSettings()

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search item, brand, or EAN..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onFiltersClick}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilters > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFilters}
              </Badge>
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <VatToggle includeVat={includeVat} onToggle={setIncludeVat} />
            
            <div className="flex items-center gap-1 bg-muted rounded-md p-1">
              <Button
                size="sm"
                variant={preferredUnit === 'kg' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('kg')}
                className="px-2 py-1 text-xs"
              >
                kg
              </Button>
              <Button
                size="sm"
                variant={preferredUnit === 'L' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('L')}
                className="px-2 py-1 text-xs"
              >
                L
              </Button>
              <Button
                size="sm"
                variant={preferredUnit === 'each' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('each')}
                className="px-2 py-1 text-xs"
              >
                each
              </Button>
              <Button
                size="sm"
                variant={preferredUnit === 'auto' ? "default" : "ghost"}
                onClick={() => setPreferredUnit('auto')}
                className="px-2 py-1 text-xs"
              >
                auto
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Prices shown per unit for apples-to-apples comparison. Toggle VAT to match your workflow.
      </div>
    </div>
  )
}
