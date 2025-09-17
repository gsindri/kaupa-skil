import { memo } from 'react'
import { SquaresFour, ListBullets } from '@phosphor-icons/react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
    'relative inline-flex h-full min-w-[var(--ctrl-h,40px)] items-center justify-center rounded-[var(--ctrl-r,12px)] px-3 text-sm font-medium text-[color:var(--ink-dim)]/80 transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-0 focus-visible:ring-offset-transparent hover:bg-white/6 hover:text-[color:var(--ink)] motion-reduce:transform-none motion-reduce:transition-none'

  return (
    <div
      role="group"
      aria-label="Change catalog view"
      className="inline-flex h-[var(--ctrl-h,40px)] items-center gap-1 rounded-[var(--ctrl-r,12px)] bg-white/5 ring-1 ring-inset ring-white/12 shadow-[var(--toolbar-ring)] transition-colors duration-150 ease-out focus-within:ring-2 focus-within:ring-[var(--focus)] focus-within:ring-offset-4 focus-within:ring-offset-[var(--toolbar-bg)] hover:ring-white/20 motion-reduce:transition-none"
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
              value === 'grid' && 'bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] hover:-translate-y-[0.5px] hover:bg-white/16 motion-reduce:transform-none'
            )}
          >
            <SquaresFour size={18} weight="fill" />
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
              value === 'list' && 'bg-white/12 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.24)] hover:-translate-y-[0.5px] hover:bg-white/16 motion-reduce:transform-none'
            )}
          >
            <ListBullets size={18} weight="fill" />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>List (L)</TooltipContent>
      </Tooltip>
    </div>
  )
})
