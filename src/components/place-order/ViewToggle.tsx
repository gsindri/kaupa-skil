import { memo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GridSoft, ListSoft } from '@/components/icons-soft'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  value: 'grid' | 'list'
  onChange: (value: 'grid' | 'list') => void
}

export const ViewToggle = memo(function ViewToggle({ value, onChange }: ViewToggleProps) {
  const createHandler = (next: 'grid' | 'list') => () => {
    if (value !== next) {
      onChange(next)
    }
  }

  const baseButton =
    'relative inline-flex h-full min-w-[var(--ctrl-h,40px)] items-center justify-center rounded-[var(--ctrl-r,12px)] px-3 text-sm font-medium text-white/60 transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-4 focus-visible:ring-offset-[color:var(--toolbar-bg)] motion-reduce:transition-none hover:text-white'

  return (
    <div
      role="group"
      aria-label="Change catalog view"
      className="inline-flex h-[var(--ctrl-h,40px)] items-center gap-1 rounded-[var(--ctrl-r,12px)] bg-white/10 ring-1 ring-inset ring-white/12 shadow-[0_18px_40px_rgba(3,10,26,0.32)] backdrop-blur-xl transition duration-200 ease-out hover:ring-white/20 motion-reduce:transition-none"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-pressed={value === 'grid'}
            aria-label="Grid view"
            aria-keyshortcuts="g"
            onClick={createHandler('grid')}
            className={cn(
              baseButton,
              value === 'grid'
                ? 'bg-white/18 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.32)_inset]'
                : 'hover:bg-white/6'
            )}
          >
            <GridSoft className="h-5 w-5" tone={value === 'grid' ? 0.22 : 0.12} />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>Grid (G)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-pressed={value === 'list'}
            aria-label="List view"
            aria-keyshortcuts="l"
            onClick={createHandler('list')}
            className={cn(
              baseButton,
              value === 'list'
                ? 'bg-white/18 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.32)_inset]'
                : 'hover:bg-white/6'
            )}
          >
            <ListSoft className="h-5 w-5" tone={value === 'list' ? 0.22 : 0.12} />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>List (L)</TooltipContent>
      </Tooltip>
    </div>
  )
})
