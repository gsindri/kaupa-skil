import * as React from 'react'

import { cn } from '@/lib/utils'

type SvgProps = React.SVGProps<SVGSVGElement> & { tone?: number }

const baseStrokeClass = 'stroke-current fill-none'
const baseStrokeProps = {
  strokeWidth: 2.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function SearchSoft({ tone = 0.12, className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <circle cx="10.6" cy="10.6" r="5.8" fill="currentColor" opacity={tone} />
      <circle cx="10.6" cy="10.55" r="5.8" {...baseStrokeProps} />
      <path d="M14.9 15.1c2.1 2 3.6 3.5 4.9 4.9" {...baseStrokeProps} />
      <path d="M8.5 7.8c1.2-.8 2.5-.9 3.6-.6" {...baseStrokeProps} opacity={0.35} />
    </svg>
  )
}

export function GlobeSoft({ tone = 0.1, className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <circle cx="12" cy="12" r="8.5" fill="currentColor" opacity={tone} />
      <circle cx="12" cy="12" r="8.5" {...baseStrokeProps} />
      <path d="M3.8 12h16.4" {...baseStrokeProps} />
      <path d="M12 3.6c2.9 2.6 2.9 14.2 0 16.8" {...baseStrokeProps} />
      <path d="M6.2 7.9c3.2 1.7 8.4 1.7 11.6 0" {...baseStrokeProps} opacity={0.7} />
      <path d="M6.2 16.1c3.2-1.7 8.4-1.7 11.6 0" {...baseStrokeProps} opacity={0.7} />
    </svg>
  )
}

export function CartSoft({ tone = 0.12, className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <path
        d="M4.2 6.8h2.2l1.6 8.5c.1.6.6 1 1.2 1h7.2c.6 0 1.1-.4 1.2-1l.9-5.4a1 1 0 0 0-1-.9H7.3"
        fill="currentColor"
        opacity={tone}
      />
      <circle cx="9.7" cy="19.2" r="1.3" fill="currentColor" />
      <circle cx="16.6" cy="19.2" r="1.3" fill="currentColor" />
      <path
        d="M3.2 5.2h2.8l1.9 9.8a1.2 1.2 0 0 0 1.2 1h7.2a1.2 1.2 0 0 0 1.2-1l.9-5.4a1 1 0 0 0-1-.9H7.1"
        {...baseStrokeProps}
      />
      <path d="M9.2 19.2h7.6" {...baseStrokeProps} opacity={0.4} />
    </svg>
  )
}

export function ChevronSoft({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <path d="M7.5 10l4.5 4.2L16.5 10" {...baseStrokeProps} />
    </svg>
  )
}

export function QuestionSoft({ tone = 0.12, className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <circle cx="12" cy="12" r="8.2" fill="currentColor" opacity={tone} />
      <path
        d="M10.2 9.3c.2-1.3 1.3-2.3 2.6-2.3 1.4 0 2.5.9 2.5 2.3 0 1-.5 1.7-1.6 2.2-.9.4-1.4 1-1.4 1.9v.4"
        {...baseStrokeProps}
      />
      <circle cx="12.6" cy="16.8" r="0.8" fill="currentColor" />
      <path d="M8.9 9.1c.3-.6.8-1.1 1.5-1.4" {...baseStrokeProps} opacity={0.3} />
    </svg>
  )
}

export function GridSoft({ tone = 0.12, className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <rect x="4.25" y="4.25" width="6.5" height="6.5" rx="2.2" fill="currentColor" opacity={tone} />
      <rect x="4.25" y="4.25" width="6.5" height="6.5" rx="2.2" {...baseStrokeProps} />
      <rect x="13.25" y="4.25" width="6.5" height="6.5" rx="2.2" fill="currentColor" opacity={tone} />
      <rect x="13.25" y="4.25" width="6.5" height="6.5" rx="2.2" {...baseStrokeProps} />
      <rect x="4.25" y="13.25" width="6.5" height="6.5" rx="2.2" fill="currentColor" opacity={tone} />
      <rect x="4.25" y="13.25" width="6.5" height="6.5" rx="2.2" {...baseStrokeProps} />
      <rect x="13.25" y="13.25" width="6.5" height="6.5" rx="2.2" fill="currentColor" opacity={tone} />
      <rect x="13.25" y="13.25" width="6.5" height="6.5" rx="2.2" {...baseStrokeProps} />
    </svg>
  )
}

export function ListSoft({ tone = 0.12, className, ...props }: SvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(baseStrokeClass, className)}
    >
      <rect x="7.75" y="5.25" width="11" height="3.5" rx="1.8" fill="currentColor" opacity={tone} />
      <rect x="7.75" y="10.25" width="11" height="3.5" rx="1.8" fill="currentColor" opacity={tone} />
      <rect x="7.75" y="15.25" width="11" height="3.5" rx="1.8" fill="currentColor" opacity={tone} />
      <rect x="7.75" y="5.25" width="11" height="3.5" rx="1.8" {...baseStrokeProps} />
      <rect x="7.75" y="10.25" width="11" height="3.5" rx="1.8" {...baseStrokeProps} />
      <rect x="7.75" y="15.25" width="11" height="3.5" rx="1.8" {...baseStrokeProps} />
      <circle cx="5.25" cy="7" r="1.1" fill="currentColor" />
      <circle cx="5.25" cy="12" r="1.1" fill="currentColor" />
      <circle cx="5.25" cy="17" r="1.1" fill="currentColor" />
    </svg>
  )
}
