import React, { useEffect, useRef, useState } from 'react'

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
  const translateWrapperRef = useRef<HTMLSpanElement>(null)
  const [transforms, setTransforms] = useState({ scale: 1, translateX: 0, translateY: 0 })
  const [isMeasuring, setIsMeasuring] = useState(true)

  useEffect(() => {
    const wrapper = translateWrapperRef.current
    if (!wrapper) {
      return
    }

    setIsMeasuring(true)

    const frame = requestAnimationFrame(() => {
      const svg = wrapper.querySelector('svg')
      if (!svg) {
        setIsMeasuring(false)
        return
      }

      try {
        const viewBox = svg.viewBox?.baseVal
        const viewBoxWidth = viewBox?.width || svg.clientWidth || size
        const viewBoxHeight = viewBox?.height || svg.clientHeight || size
        const viewBoxX = viewBox?.x || 0
        const viewBoxY = viewBox?.y || 0

        let bbox: DOMRect | undefined
        try {
          bbox = svg.getBBox()
        } catch (error) {
          console.warn('NavIcon measurement failed:', error)
        }

        const contentWidth = bbox?.width || viewBoxWidth
        const contentHeight = bbox?.height || viewBoxHeight
        const contentMaxDimension = Math.max(contentWidth, contentHeight)
        const viewBoxMaxDimension = Math.max(viewBoxWidth, viewBoxHeight)

        const scale =
          contentMaxDimension > 0 && viewBoxMaxDimension > 0
            ? Math.max(1, viewBoxMaxDimension / contentMaxDimension)
            : 1

        const viewBoxCenterX = viewBoxX + viewBoxWidth / 2
        const viewBoxCenterY = viewBoxY + viewBoxHeight / 2
        const contentCenterX = (bbox?.x ?? viewBoxX) + ((bbox?.width ?? viewBoxWidth) / 2)
        const contentCenterY = (bbox?.y ?? viewBoxY) + ((bbox?.height ?? viewBoxHeight) / 2)

        const pixelsPerUnit = viewBoxMaxDimension > 0 ? size / viewBoxMaxDimension : 1

        const translateX = (viewBoxCenterX - contentCenterX) * scale * pixelsPerUnit
        const translateY = (viewBoxCenterY - contentCenterY) * scale * pixelsPerUnit

        setTransforms({
          scale: Number.isFinite(scale) ? scale : 1,
          translateX: Number.isFinite(translateX) ? translateX : 0,
          translateY: Number.isFinite(translateY) ? translateY : 0,
        })
      } finally {
        setIsMeasuring(false)
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [Icon, size])

  return (
    <span
      className={cn(
        'nav-icon grid w-12 h-12 place-items-center rounded-xl transition-all duration-200',
        'bg-transparent overflow-visible'
      )}
    >
      <span
        data-nav-icon-scale=""
        style={{
          transform: `scale(${transforms.scale})`,
          transformOrigin: 'center'
        }}
      >
        <span
          data-nav-icon-translate=""
          ref={translateWrapperRef}
          style={{
            transform: `translate(${transforms.translateX}px, ${transforms.translateY}px)`,
            display: 'block'
          }}
        >
          <Icon
            data-active={active}
            data-hovered={hovered ? 'true' : undefined}
            data-nav-measuring={isMeasuring ? 'true' : undefined}
            width={size}
            height={size}
            className={cn(
              'pointer-events-auto text-white/80 group-hover:text-white transition-all duration-200',
              '[filter:drop-shadow(0_0_4px_rgba(255,255,255,0.4))]',
              active && 'text-white [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.7))]',
              isMeasuring && 'opacity-0',
              className
            )}
            role="img"
            aria-hidden={false}
            aria-label={label}
          />
        </span>
      </span>
    </span>
  )
}
