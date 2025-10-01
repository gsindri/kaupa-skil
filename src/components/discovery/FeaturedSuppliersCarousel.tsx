import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EnhancedSupplier } from '@/hooks/useSupplierSearch'

interface FeaturedSuppliersCarouselProps {
  suppliers: EnhancedSupplier[]
  isLoading: boolean
  onSupplierClick: (supplier: EnhancedSupplier) => void
}

export function FeaturedSuppliersCarousel({
  suppliers,
  isLoading,
  onSupplierClick,
}: FeaturedSuppliersCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Featured Suppliers</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="min-w-[280px]">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (suppliers.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Featured Suppliers</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => scroll('left')}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => scroll('right')}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
      >
        {suppliers.map((supplier) => (
          <Card
            key={supplier.id}
            className="min-w-[280px] cursor-pointer transition-all hover:shadow-md"
            onClick={() => onSupplierClick(supplier)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {supplier.logo_url ? (
                  <img
                    src={supplier.logo_url}
                    alt={supplier.display_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{supplier.display_name}</h3>
                  {supplier.categories.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {supplier.categories[0].name}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Featured
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
