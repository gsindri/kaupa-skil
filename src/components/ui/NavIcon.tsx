import React from 'react'

import { cn } from '@/lib/utils'

type IconProps = {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  active?: boolean
  /**
   * Target rendered size (in pixels) for the longest side of the SVG graphic.
   * Icons are automatically scaled up so their visual footprint matches
   * larger illustrations like the Compare and Price nav icons.
   */
  size?: number
  className?: string
  label: string
  hovered?: boolean
}

export function NavIcon({ Icon, active, size = 44, className, label, hovered }: IconProps) {
  return (
    <span
      className={cn(
        'nav-icon grid w-12 h-12 place-items-center rounded-xl transition-all duration-200',
        'bg-transparent overflow-visible'
      )}
    >
      <Icon
        data-active={active}
        data-hovered={hovered ? 'true' : undefined}
        width={size}
        height={size}
        className={cn(
          'pointer-events-auto text-white/80 group-hover:text-white transition-all duration-200',
          '[filter:drop-shadow(0_0_4px_rgba(255,255,255,0.4))]',
          active && 'text-white [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.7))]',
          className
        )}
        role="img"
        aria-hidden={false}
        aria-label={label}
      />
    </span>
  )
}
