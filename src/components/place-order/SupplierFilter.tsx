import { memo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Vendor } from '@/hooks/useVendors'

interface SupplierFilterProps {
  suppliers: Vendor[]
  value: string
  onChange: (value: string) => void
}

export const SupplierFilter = memo(function SupplierFilter({
  suppliers,
  value,
  onChange,
}: SupplierFilterProps) {
  return (
    <Select
      value={value || 'all'}
      onValueChange={v => onChange(v === 'all' ? '' : v)}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All suppliers" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All suppliers</SelectItem>
        {suppliers.map(s => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
})
