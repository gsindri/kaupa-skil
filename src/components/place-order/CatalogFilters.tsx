import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface CatalogFiltersProps {
  category: string
  brand: string
  categories: string[]
  hasPrice: boolean
  onCategoryChange: (value: string) => void
  onBrandChange: (value: string) => void
  onHasPriceChange: (value: boolean) => void
}

export const CatalogFilters = memo(function CatalogFilters({
  category,
  brand,
  categories,
  hasPrice,
  onCategoryChange,
  onBrandChange,
  onHasPriceChange
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

      <Input
        placeholder="Brand"
        value={brand}
        onChange={e => onBrandChange(e.target.value)}
        className="h-10 w-36"
      />

      <div className="flex items-center space-x-2">
        <Checkbox id="price" checked={hasPrice} onCheckedChange={v => onHasPriceChange(Boolean(v))} />
        <label htmlFor="price" className="text-sm">Has price</label>
      </div>
    </div>
  )
})
