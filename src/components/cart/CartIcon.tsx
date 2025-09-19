import * as React from 'react'

export type CartIconProps = {
  count?: number
  title?: string
  className?: string
} & React.SVGProps<SVGSVGElement>

export default function CartIcon({
  count = 0,
  title = 'Cart',
  className,
  ...rest
}: CartIconProps) {
  const display = count >= 100 ? '99+' : String(count)
  const glyphLength = display.length

  const fontSize = React.useMemo(() => {
    if (glyphLength >= 3) return 5.4
    if (glyphLength === 2) return 6.6
    return 7.4
  }, [glyphLength])

  const verticalPosition = React.useMemo(() => {
    if (glyphLength >= 3) return 11.2
    if (glyphLength === 2) return 11.5
    return 11.8
  }, [glyphLength])

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        <path d="M6.8 17H18.5" />
        <path d="M6.8 17L5 7.5 3.4 6.2" />
        <path d="M3.4 6.2L2.2 5.8" />
        <path d="M18.5 17L19.4 13 20.2 9" />
      </g>

      <g fill="#ffffff" stroke="currentColor" strokeWidth={1.3} vectorEffect="non-scaling-stroke">
        <circle cx="10" cy="19.2" r="0.7" />
        <circle cx="16" cy="19.2" r="0.7" />
      </g>

      <text
        x="13"
        y={verticalPosition}
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight={800}
        fontSize={fontSize}
        fill="#f59e0b"
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial",
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {display}
      </text>
    </svg>
  )
}
