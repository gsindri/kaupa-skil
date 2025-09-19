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
  const clipPathId = React.useId()
  const display = count >= 100 ? '99+' : String(count)
  const showCount = count > 0

  return (
    <svg
      viewBox="0 0 768 768"
      role="img"
      aria-label={title}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}

      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.75}
      >
        <path d="M230 430 L525 410" />
        <path d="M230 430 a56 59 0 0 0 0 112" />
        <path d="M275 499 H560" />
        <path d="M230 430 L195 270 L115 245" />
        <path d="M525 410 L575 230" />
      </g>

      <g stroke="currentColor" strokeWidth={16} vectorEffect="non-scaling-stroke">
        <circle cx="340" cy="570" r="22" fill="#f59e0b" />
        <circle cx="505" cy="570" r="22" fill="#f59e0b" />
      </g>

      {showCount && (
        <>
          <defs>
            <clipPath id={clipPathId}>
              <polygon points="250,430 520,410 560,499 275,499" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipPathId})`}>
            <text
              x="410"
              y="465"
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight={600}
              fill="#f59e0b"
              fontSize={170}
              letterSpacing={-6}
              style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums' }}
            >
              {display}
            </text>
          </g>

          <path
            d="M230 430 L525 410"
            fill="none"
            stroke="currentColor"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </svg>
  )
}
