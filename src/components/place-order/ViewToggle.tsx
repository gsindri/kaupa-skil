import { memo } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ViewToggleProps {
  value: 'grid' | 'list'
  onChange: (value: 'grid' | 'list') => void
}

export const ViewToggle = memo(function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={v => v && onChange(v as 'grid' | 'list')}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="grid"
            aria-label="Grid view"
            className="group transition-all duration-200 data-[state=on]:bg-muted data-[state=on]:text-primary data-[state=on]:shadow-inner"
          >
            <div className="grid h-4 w-4 grid-cols-2 gap-0.5 transition-transform group-hover:scale-110">
              <span className="h-1.5 w-1.5 rounded-sm bg-current" />
              <span className="h-1.5 w-1.5 rounded-sm bg-current" />
              <span className="h-1.5 w-1.5 rounded-sm bg-current" />
              <span className="h-1.5 w-1.5 rounded-sm bg-current" />
            </div>
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Grid view</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem
            value="list"
            aria-label="Compact list"
            className="group transition-all duration-200 data-[state=on]:bg-muted data-[state=on]:text-primary data-[state=on]:shadow-inner"
          >
            <div className="flex h-4 w-4 flex-col gap-0.5 transition-transform group-hover:scale-110">
              <span className="h-0.5 w-3 rounded-sm bg-current" />
              <span className="h-0.5 w-3 rounded-sm bg-current" />
              <span className="h-0.5 w-3 rounded-sm bg-current" />
            </div>
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Compact list</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  )
})
