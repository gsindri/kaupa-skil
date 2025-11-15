import * as React from 'react'

import { cn } from '@/lib/utils'

type SvgProps = React.SVGProps<SVGSVGElement> & { tone?: number }
type CSSVariableStyle = React.CSSProperties & {
  [key: `--${string}`]: string | number | undefined
}

type CartSoftProps = SvgProps & { count?: string | number }

const baseStrokeClass = 'stroke-current fill-none'
const baseStrokeProps = {
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export function SearchSoft({ className, ...props }: SvgProps) {
  console.log('🔍 SearchSoft called with props:', { className, props });
  
  return (
    <span 
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '22px',
        height: '22px',
        fontSize: '20px',
        lineHeight: '22px',
        textAlign: 'center',
        background: '#ff0000',
        color: '#ffff00',
        border: '2px solid #00ff00'
      }}
    >
      X
    </span>
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

export function CartSoft({ tone = 0.12, className, count, style, ...props }: CartSoftProps) {
  const reactId = React.useId()
  const clipPathId = `cart-basket-${reactId.replace(/:/g, '')}`

  const normalizedTone = Number.isFinite(tone) ? Math.min(Math.max(tone, 0), 1) : 0
  const cartOpacity = normalizedTone >= 1 ? 1 : Math.max(0.35, normalizedTone * 2.4)

  const countValue =
    typeof count === 'number' || typeof count === 'string' ? String(count).trim() : ''
  const showCount = countValue.length > 0
  const textLength = countValue.length > 2 ? 11.6 : 9.2

  const cssVariables: CSSVariableStyle = {
    '--ink': 'currentColor',
    '--count': 'var(--cart-count-color, #f59e0b)',
    '--sw': 1.3,
    '--cartOpacity': cartOpacity
  }

  const mergedStyle: CSSVariableStyle = style
    ? {
        ...cssVariables,
        ...(style as CSSVariableStyle)
      }
    : cssVariables

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
      className={cn(className)}
      style={mergedStyle}
    >
      <defs>
        <clipPath id={clipPathId} clipPathUnits="userSpaceOnUse">
          <polygon points="5,9.15 14.2,9.15 13.5,12.8 6.6,12.8" />
        </clipPath>
      </defs>

      {showCount ? (
        <g clipPath={`url(#${clipPathId})`}>
          <text
            x={9.6}
            y={10.8}
            dominantBaseline="middle"
            textAnchor="middle"
            lengthAdjust="spacingAndGlyphs"
            textLength={textLength}
            fill="var(--count)"
            style={{
              font: "800 10px system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,'Apple Color Emoji','Segoe UI Emoji'"
            }}
          >
            {countValue}
          </text>
        </g>
      ) : null}

      <g
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="var(--sw)"
        opacity="var(--cartOpacity)"
        vectorEffect="non-scaling-stroke"
        shapeRendering="geometricPrecision"
      >
        <path d="M4 6.2L6.2 9.1" />
        <path d="M6.2 9.1H14.2" />
        <path d="M6.2 9.1L8 13" />
        <path d="M7.2 13H14.2" />
        <circle cx="9" cy="16" r="1.35" />
        <circle cx="14.2" cy="16" r="1.35" />
      </g>
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
