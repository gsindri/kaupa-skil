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
      logo_url?: string | null
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
      const vendor = vendors.find(v => v.name === s)
      return {
        name: s,
        connected: !!vendor,
        logoUrl: vendor?.logo_url || vendor?.logoUrl || null,
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
      logoUrl: s.logoUrl || s.logo_url || null,
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

  const visible = items.slice(0, 2)
  const extra = items.length - visible.length

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map(it => (
        <SupplierChip
          key={it.name}
          name={it.name}
          logoUrl={it.logoUrl}
          connected={it.connected}
          availability={it.availability}
          className="h-5 w-5"
          tabIndex={0}
          aria-label={it.name}
          onClick={() => handleClick(it)}
          onKeyDown={e => e.key === 'Enter' && handleClick(it)}
        />
      ))}
      {extra > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px]">
          +{extra}
        </span>
      )}
    </div>
  )
}

