import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SortControlProps {
  value: string
  onChange: (value: string) => void
}

export const SortControl = memo(function SortControl({ value, onChange }: SortControlProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name">Name</SelectItem>
        <SelectItem value="price">Price</SelectItem>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="popular">Popular</SelectItem>
      </SelectContent>
    </Select>
  )
})
