import React, { useRef, useEffect, useState } from 'react'

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

const SCALE_EPSILON = 0.000001
const TRANSLATE_EPSILON = 0.0001

type TransformState = {
  scale: number
  translateX: number
  translateY: number
}

const DEFAULT_TRANSFORM: TransformState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
}

export function NavIcon({ Icon, active, size = 44, className, label, hovered }: IconProps) {
  const scaleWrapperRef = useRef<HTMLSpanElement>(null)
  const [transforms, setTransforms] = useState<TransformState>(DEFAULT_TRANSFORM)
  const [isMeasuring, setIsMeasuring] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsMeasuring(true)

    const frameId = requestAnimationFrame(() => {
      if (cancelled) return

      const current = scaleWrapperRef.current?.querySelector('svg') as SVGSVGElement | null
      if (!current) {
        if (!cancelled) {
          setTransforms(DEFAULT_TRANSFORM)
          setIsMeasuring(false)
        }
        return
      }

      try {
        const viewBox = current.viewBox?.baseVal
        const hasValidViewBox = Boolean(viewBox && viewBox.width > 0 && viewBox.height > 0)

        const fallbackWidth = current.clientWidth || size
        const fallbackHeight = current.clientHeight || size

        const viewBoxWidth = hasValidViewBox && viewBox ? viewBox.width : fallbackWidth
        const viewBoxHeight = hasValidViewBox && viewBox ? viewBox.height : fallbackHeight
        const viewBoxX = hasValidViewBox && viewBox ? viewBox.x : 0
        const viewBoxY = hasValidViewBox && viewBox ? viewBox.y : 0

        let bbox: DOMRect | undefined
        try {
          bbox = current.getBBox()
        } catch (error) {
          bbox = undefined
        }

        const contentWidth = bbox && bbox.width > 0 ? bbox.width : viewBoxWidth
        const contentHeight = bbox && bbox.height > 0 ? bbox.height : viewBoxHeight

        const contentCenterX =
          bbox && contentWidth > 0
            ? bbox.x + contentWidth / 2
            : viewBoxX + viewBoxWidth / 2
        const contentCenterY =
          bbox && contentHeight > 0
            ? bbox.y + contentHeight / 2
            : viewBoxY + viewBoxHeight / 2

        const targetSize = size
        const safeContentWidth = contentWidth > 0 ? contentWidth : viewBoxWidth || targetSize
        const safeContentHeight = contentHeight > 0 ? contentHeight : viewBoxHeight || targetSize

        const rawScale =
          safeContentWidth > 0 && safeContentHeight > 0
            ? Math.min(targetSize / safeContentWidth, targetSize / safeContentHeight)
            : 1

        const viewBoxCenterX = viewBoxX + viewBoxWidth / 2
        const viewBoxCenterY = viewBoxY + viewBoxHeight / 2

        const viewBoxMaxDimension = Math.max(viewBoxWidth, viewBoxHeight)
        const pixelPerViewBoxUnit =
          viewBoxMaxDimension > 0 ? targetSize / viewBoxMaxDimension : 1

        const centerOffsetX = viewBoxCenterX - contentCenterX
        const centerOffsetY = viewBoxCenterY - contentCenterY

        const rawTranslateX = centerOffsetX * rawScale * pixelPerViewBoxUnit
        const rawTranslateY = centerOffsetY * rawScale * pixelPerViewBoxUnit

        const nextScale = Math.abs(rawScale - 1) > SCALE_EPSILON ? rawScale : 1
        const nextTranslateX = Math.abs(rawTranslateX) > TRANSLATE_EPSILON ? rawTranslateX : 0
        const nextTranslateY = Math.abs(rawTranslateY) > TRANSLATE_EPSILON ? rawTranslateY : 0

        if (!cancelled) {
          setTransforms({
            scale: Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1,
            translateX: Number.isFinite(nextTranslateX) ? nextTranslateX : 0,
            translateY: Number.isFinite(nextTranslateY) ? nextTranslateY : 0,
          })
          setIsMeasuring(false)
        }
      } catch (error) {
        if (!cancelled) {
          setTransforms(DEFAULT_TRANSFORM)
          setIsMeasuring(false)
        }
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [Icon, size])

  const translateStyle =
    transforms.translateX !== 0 || transforms.translateY !== 0
      ? `translate(${transforms.translateX}px, ${transforms.translateY}px)`
      : undefined

  const scaleStyle = transforms.scale !== 1 ? `scale(${transforms.scale})` : undefined

  return (
    <span
      className={cn(
        'nav-icon grid w-12 h-12 place-items-center rounded-xl transition-all duration-200',
        'bg-transparent overflow-visible'
      )}
    >
      <span className="flex h-full w-full items-center justify-center">
        <span
          data-nav-icon-translate
          className="flex items-center justify-center"
          style={{
            transform: translateStyle,
            transformOrigin: 'center center',
          }}
        >
          <span
            data-nav-icon-scale
            className="flex items-center justify-center"
            style={{
              transform: scaleStyle,
              transformOrigin: 'center center',
            }}
            ref={scaleWrapperRef}
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
                className
              )}
              role="img"
              aria-hidden={false}
              aria-label={label}
            />
          </span>
        </span>
      </span>
    </span>
  )
}
