import SupplierChip from '@/components/catalog/SupplierChip'
import { useVendors } from '@/hooks/useVendors'
import { toast } from '@/hooks/use-toast'
import type { AvailabilityStatus } from '@/components/catalog/AvailabilityBadge'

export type SupplierEntry =
  | string
  | {
      name: string
      connected?: boolean
      logoUrl?: string | null
      availability_status?: AvailabilityStatus | null
      status?: AvailabilityStatus | null
      availability?: { status?: AvailabilityStatus | null; updatedAt?: string | Date | null }
      availability_updated_at?: string | Date | null
    }

export default function SupplierList({
  suppliers,
  locked,
}: {
  suppliers: SupplierEntry[]
  locked?: boolean
}) {
  const { vendors } = useVendors()

  const items = suppliers.map(s => {
    if (typeof s === 'string') {
      return {
        name: s,
        connected: vendors.some(v => v.name === s),
      }
    }
    const status =
      s.availability?.status ??
      s.availability_status ??
      s.status ??
      null
    const updated =
      s.availability?.updatedAt ??
      s.availability_updated_at ??
      null
    return {
      name: s.name,
      connected: s.connected ?? vendors.some(v => v.name === s.name),
      availability: status ? { status, updatedAt: updated } : undefined,
    }
  })

  const handleClick = (it: {
    name: string
    connected: boolean
    availability?: { status?: AvailabilityStatus | null }
  }) => {
    if (locked) return
    if (it.availability?.status === 'OUT_OF_STOCK') {
      toast({ description: 'Out of stock at selected supplier.' })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(it => (
        <SupplierChip
          key={it.name}
          name={it.name}
          connected={it.connected}
          availability={it.availability}
          className="h-5 w-5"
          tabIndex={0}
          aria-label={it.name}
          onClick={() => handleClick(it)}
          onKeyDown={e => e.key === 'Enter' && handleClick(it)}
        />
      ))}
    </div>
  )
}

