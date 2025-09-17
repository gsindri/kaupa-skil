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
          'group inline-grid h-[var(--icon-btn,2.5rem)] w-[var(--icon-btn,2.5rem)] place-items-center rounded-full ring-1 ring-white/10',
          'bg-transparent text-white/80 transition-[background-color,color,transform,box-shadow] duration-150 ease-out motion-reduce:transition-none',
          'hover:bg-white/5 hover:text-white hover:ring-white/20',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent',
          'motion-safe:hover:-translate-y-[0.5px] motion-reduce:transform-none motion-reduce:hover:translate-y-0',
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
