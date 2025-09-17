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
    'grid size-[var(--icon-btn,40px)] place-items-center rounded-full text-[color:var(--ink-dim)] transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent hover:text-[color:var(--ink)] motion-reduce:transition-none'

  return (
    <div
      role="group"
      aria-label="Change catalog view"
      className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/10 p-1 shadow-[var(--toolbar-ring)]"
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
              value === 'grid' && 'bg-white/20 text-[color:var(--ink)] shadow-inner shadow-black/20'
            )}
          >
            <SquaresFour size={20} weight={value === 'grid' ? 'fill' : 'duotone'} />
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
              value === 'list' && 'bg-white/20 text-[color:var(--ink)] shadow-inner shadow-black/20'
            )}
          >
            <ListBullets size={20} weight={value === 'list' ? 'fill' : 'duotone'} />
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>List (L)</TooltipContent>
      </Tooltip>
    </div>
  )
})
