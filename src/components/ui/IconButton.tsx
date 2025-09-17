import * as React from 'react'

import { cn } from '@/lib/utils'

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      children,
      className,
      title,
      type,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-label={ariaLabel ?? label}
        title={title ?? label}
        className={cn(
          'group inline-grid h-10 w-10 place-items-center rounded-full ring-1 ring-white/10',
          'bg-transparent text-slate-200 transition-colors duration-150 ease-out',
          'hover:bg-white/5 hover:text-white hover:ring-white/20',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
          className
        )}
        {...props}
      >
        <span className="text-inherit transition-colors duration-150 ease-out group-hover:text-white">
          {children}
        </span>
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
