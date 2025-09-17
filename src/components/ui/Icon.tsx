import React from 'react'
import { type IconProps } from '@phosphor-icons/react'

import { cn } from '@/lib/utils'

type IconWrapperProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactElement<IconProps>
  size?: number
}

export function Icon({ children, size, className, style, ...props }: IconWrapperProps) {
  const finalSize = size ?? (children.props.size as number | undefined) ?? 24

  return (
    <span
      className={cn('inline-grid place-items-center text-current leading-none', className)}
      style={{ width: finalSize, height: finalSize, ...style }}
      {...props}
    >
      {React.cloneElement(children, {
        size: finalSize,
        weight: children.props.weight
      })}
    </span>
  )
}
