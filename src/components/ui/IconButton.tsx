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
          'group inline-grid h-[var(--icon-btn,2.5rem)] w-[var(--icon-btn,2.5rem)] h-10 w-10 place-items-center rounded-full',
          'bg-transparent text-[color:var(--ink-dim,rgba(236,242,248,0.68))] transition-[background-color,color,transform,box-shadow] duration-fast ease-snap motion-reduce:transition-none',
          'hover:bg-white/10 hover:text-[color:var(--ink,rgba(236,242,248,0.88))]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent',
          'motion-safe:hover:-translate-y-[0.5px] motion-reduce:transform-none motion-reduce:hover:translate-y-0',
          className
        )}
        {...props}
      >
        <span className="text-inherit transition-colors duration-fast ease-snap group-hover:text-[color:var(--ink,rgba(236,242,248,0.88))]">
          {children}
        </span>
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
