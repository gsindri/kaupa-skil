import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface CatalogFiltersProps {
  category: string
  categories: string[]
  inStock: boolean
  onCategoryChange: (value: string) => void
  onInStockChange: (value: boolean) => void
}

export const CatalogFilters = memo(function CatalogFilters({
  category,
  categories,
  inStock,
  onCategoryChange,
  onInStockChange
}: CatalogFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <Select value={category} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          {categories.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center space-x-2">
        <Checkbox id="stock" checked={inStock} onCheckedChange={v => onInStockChange(Boolean(v))} />
        <label htmlFor="stock" className="text-sm">In stock</label>
      </div>
    </div>
  )
})
