import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FilterChip({
  label, active, onToggle, onRemove, className
}: { label: string; active: boolean; onToggle: () => void; onRemove?: () => void; className?: string }) {
  return (
    <div className={cn('inline-flex items-center rounded-full border px-2 py-1 text-xs', active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted', className)}>
      <button type="button" className="px-1" onClick={onToggle} aria-pressed={active}>{label}</button>
      {active && onRemove && (
        <button type="button" className="ml-1 rounded p-0.5 hover:bg-black/10" aria-label={`Remove ${label}`} onClick={onRemove}>
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
