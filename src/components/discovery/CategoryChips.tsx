import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/hooks/useSupplierSearch'
import { cn } from '@/lib/utils'

interface CategoryChipsProps {
  categories: Category[]
  selectedIds: string[]
  onToggle: (categoryId: string) => void
  isLoading: boolean
}

export function CategoryChips({
  categories,
  selectedIds,
  onToggle,
  isLoading,
}: CategoryChipsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
    )
  }

  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selectedIds.includes(category.id)
        return (
          <Badge
            key={category.id}
            variant={isSelected ? 'default' : 'outline'}
            className={cn(
              'cursor-pointer transition-all hover:opacity-80',
              isSelected && 'shadow-sm'
            )}
            onClick={() => onToggle(category.id)}
          >
            {category.name}
          </Badge>
        )
      })}
    </div>
  )
}
