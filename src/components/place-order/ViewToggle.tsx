import {
  forwardRef,
  memo,
  useEffect,
  useRef,
} from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type View = 'grid' | 'list'

interface ViewToggleProps {
  value: View
  onChange: (value: View) => void
  className?: string
}

const STORAGE_KEY = 'catalog:view'

export const ViewToggle = memo(function ViewToggle({
  value,
  onChange,
  className,
}: ViewToggleProps) {
  const gridButtonRef = useRef<HTMLButtonElement>(null)
  const listButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore */
    }
  }, [value])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return

    const key = event.key
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault()
      const next = value === 'grid' ? 'list' : 'grid'
      onChange(next)
      const ref = next === 'grid' ? gridButtonRef : listButtonRef
      ref.current?.focus()
      return
    }

    const lower = key.toLowerCase()
    if (lower === 'g' && value !== 'grid') {
      event.preventDefault()
      onChange('grid')
      gridButtonRef.current?.focus()
      return
    }

    if (lower === 'l' && value !== 'list') {
      event.preventDefault()
      onChange('list')
      listButtonRef.current?.focus()
    }
  }

  return (
    <div
      role="group"
      aria-label="View"
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center rounded-full border border-white/20 bg-slate-800/80 px-1 py-1 text-sm text-slate-100 shadow-sm backdrop-blur supports-[backdrop-filter]:backdrop-blur-md',
        className,
      )}
    >
      <SegButton
        ref={gridButtonRef}
        active={value === 'grid'}
        title="Grid view (g)"
        ariaLabel="Grid view"
        shortcut="g"
        onClick={() => onChange('grid')}
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M10 3H3v7h7V3zm11 0h-7v7h7V3zM10 14H3v7h7v-7zm11 0h-7v7h7v-7z"
            />
          </svg>
        }
      />

      <div className="mx-0.5 h-6 w-px bg-white/15" aria-hidden="true" />

      <SegButton
        ref={listButtonRef}
        active={value === 'list'}
        title="List view (l)"
        ariaLabel="List view"
        shortcut="l"
        onClick={() => onChange('list')}
        icon={
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"
            />
          </svg>
        }
      />
    </div>
  )
})

interface SegButtonProps {
  active: boolean
  title: string
  ariaLabel: string
  shortcut: string
  onClick: () => void
  icon: ReactNode
}

const SegButton = forwardRef<HTMLButtonElement, SegButtonProps>(function SegButton(
  { active, title, ariaLabel, shortcut, onClick, icon },
  ref,
) {
  const content = (
    <button
      ref={ref}
      type="button"
      title={title}
      aria-pressed={active}
      aria-label={ariaLabel}
      aria-keyshortcuts={shortcut}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:outline-none',
        active
          ? 'bg-slate-700 text-slate-50 shadow-inner'
          : 'bg-transparent text-slate-300 hover:text-slate-50',
      )}
    >
      {active && (
        <svg
          className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-100"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
          />
        </svg>
      )}
      <span className={cn('flex items-center justify-center', active && 'pl-4')}>
        {icon}
      </span>
    </button>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent sideOffset={8}>{title}</TooltipContent>
    </Tooltip>
  )
})
