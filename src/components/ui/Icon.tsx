import React from 'react'

import { cn } from '@/lib/utils'

type IconElement = React.ReactElement<
  React.SVGProps<SVGSVGElement> & {
    size?: number
    weight?: unknown
  }
>

type IconWrapperProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: IconElement
  size?: number
}

export function Icon({ children, size, className, style, ...props }: IconWrapperProps) {
  const inferredSize = typeof children.props.size === 'number' ? children.props.size : undefined
  const finalSize = size ?? inferredSize ?? 24

  const nextProps: Partial<React.SVGProps<SVGSVGElement>> & { size?: number } = {
    width: finalSize,
    height: finalSize
  }

  if ('size' in children.props || inferredSize != null) {
    nextProps.size = finalSize
  }

  return (
    <span
      className={cn('inline-grid place-items-center text-current leading-none', className)}
      style={{ width: finalSize, height: finalSize, ...style }}
      {...props}
    >
      {React.cloneElement(children, nextProps)}
    </span>
  )
}
