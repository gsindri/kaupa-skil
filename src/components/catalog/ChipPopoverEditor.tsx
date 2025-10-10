import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface ChipPopoverEditorProps {
  trigger: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  children: React.ReactNode
}

export function ChipPopoverEditor({
  trigger,
  open,
  onOpenChange,
  title,
  children,
}: ChipPopoverEditorProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-auto min-w-[280px] max-w-[400px] p-3"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="text-sm font-semibold text-[color:var(--ink)]">{title}</div>
          <div className="text-sm">{children}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
