import { memo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SquaresFour, List } from '@phosphor-icons/react'
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
    'inline-flex h-full min-w-[var(--ctrl-h,40px)] items-center justify-center gap-2 px-3 text-sm font-semibold whitespace-nowrap transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent motion-reduce:transition-none'

  const activeClasses =
    'bg-[color:var(--seg-active-bg)] text-[color:var(--ink-hi)] shadow-[0_16px_36px_rgba(3,10,26,0.38)]'
  const inactiveClasses =
    'text-[color:var(--ink-dim)] hover:bg-[color:var(--chip-bg-hover)] hover:text-[color:var(--ink)]'

  return (
    <div
      role="group"
      aria-label="Change catalog view"
      className="inline-grid h-[var(--ctrl-h,40px)] grid-cols-2 overflow-hidden rounded-[var(--ctrl-r,12px)] bg-[color:var(--chip-bg)] ring-1 ring-inset ring-[color:var(--ring-idle)] shadow-[0_20px_40px_rgba(2,9,20,0.24)] backdrop-blur-xl transition duration-200 ease-out motion-reduce:transition-none"
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
              value === 'grid' ? activeClasses : inactiveClasses,
            )}
          >
            <SquaresFour size={24} weight="fill" aria-hidden="true" />
            <span className="text-[0.8rem]">Grid</span>
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
              value === 'list' ? activeClasses : inactiveClasses,
            )}
          >
            <List size={24} weight="fill" aria-hidden="true" />
            <span className="text-[0.8rem]">List</span>
          </button>
        </TooltipTrigger>
        <TooltipContent sideOffset={8}>List (L)</TooltipContent>
      </Tooltip>
    </div>
  )
})
