import { isValidElement, useState } from 'react'
import SupplierLogo from './SupplierLogo'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Availability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | null | undefined

interface SupplierInfo {
  supplier_id: string
  supplier_name: string
  supplier_logo_url?: string | null
  is_connected: boolean
  availability_state?: Availability
  location_city?: string | null
  location_country_code?: string | null
}

interface SupplierChipsProps {
  suppliers: SupplierInfo[]
}

const AVAILABILITY_ORDER: Record<string, number> = {
  IN_STOCK: 0,
  LOW_STOCK: 1,
  OUT_OF_STOCK: 2,
  UNKNOWN: 3,
}

export default function SupplierChips({ suppliers }: SupplierChipsProps) {
  const [active, setActive] = useState<SupplierInfo | null>(null)

  const sorted = [...suppliers].sort((a, b) => {
    if (a.is_connected !== b.is_connected) return a.is_connected ? -1 : 1
    const aOrder = AVAILABILITY_ORDER[a.availability_state || 'UNKNOWN']
    const bOrder = AVAILABILITY_ORDER[b.availability_state || 'UNKNOWN']
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.supplier_name.localeCompare(b.supplier_name)
  })

  const visible = sorted.slice(0, 2)
  const overflow = sorted.length - visible.length

  const renderChip = (s: SupplierInfo) => {
    const initials = s.supplier_name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0]!)
      .join('')
      .slice(0, 2)
      .toUpperCase()
    const loc = s.location_city || s.location_country_code
    const aria = s.is_connected
      ? `Supplier: ${s.supplier_name}`
      : `Supplier: ${s.supplier_name} (price locked)`
    const locationFull = [s.location_city, s.location_country_code]
      .filter(Boolean)
      .join(', ')

    const chip = (
      <button
        type="button"
        className={cn(
          'flex items-center gap-1 rounded-full bg-muted pl-1 pr-2 h-6 max-w-full',
          !s.is_connected && 'pr-1'
        )}
        onClick={() => setActive(s)}
        tabIndex={0}
        aria-label={aria}
      >
        <SupplierLogo
          name={s.supplier_name}
          logoUrl={s.supplier_logo_url}
          className="h-4 w-4"
        />
        <span className="truncate text-xs">
          {s.supplier_name}
          {loc && (
            <span className="ml-1 text-muted-foreground">· {loc}</span>
          )}
        </span>
        {!s.is_connected && <Lock className="ml-1 h-3 w-3 text-muted-foreground" />}
      </button>
    )

    const tooltipTriggerChild = isValidElement(chip)
      ? chip
      : (
        <button
          type="button"
          className="flex items-center gap-1 rounded-full bg-muted pl-1 pr-2 h-6 max-w-full"
          onClick={() => setActive(s)}
          tabIndex={0}
          aria-label={aria}
        >
          <span className="truncate text-xs">{s.supplier_name || 'Unknown supplier'}</span>
        </button>
      )

    return loc ? (
      <Tooltip key={s.supplier_id}>
        <TooltipTrigger asChild>{tooltipTriggerChild}</TooltipTrigger>
        <TooltipContent>{locationFull}</TooltipContent>
      </Tooltip>
    ) : (
      <span key={s.supplier_id}>{chip}</span>
    )
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        {visible.map(renderChip)}
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="flex h-6 items-center justify-center rounded-full bg-muted px-2 text-xs"
                aria-label={`Plus ${overflow} more suppliers`}
              >
                +{overflow}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {sorted.slice(2).map(s => (
                <div key={s.supplier_id}>{s.supplier_name}</div>
              ))}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <Drawer open={!!active} onOpenChange={o => !o && setActive(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{active?.supplier_name}</DrawerTitle>
            {!active?.is_connected && (
              <DrawerDescription>Price locked</DrawerDescription>
            )}
          </DrawerHeader>
          <DrawerFooter>
            {!active?.is_connected && (
              <Button className="w-full">Connect</Button>
            )}
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

