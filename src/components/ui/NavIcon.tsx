import React from 'react'
import { cn } from "@/lib/utils"

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

const SCALE_EPSILON = 0.001
const TRANSLATE_EPSILON = 0.1

export function NavIcon({ Icon, active, size = 44, className, label, hovered }: IconProps) {
  const translateWrapperRef = React.useRef<HTMLSpanElement>(null)
  const scaleWrapperRef = React.useRef<HTMLSpanElement>(null)
  const [scale, setScale] = React.useState(1)
  const [translate, setTranslate] = React.useState({ x: 0, y: 0 })

  React.useLayoutEffect(() => {
    const translateWrapper = translateWrapperRef.current
    const scaleWrapper = scaleWrapperRef.current
    if (!translateWrapper || !scaleWrapper) return

    const svg = scaleWrapper.querySelector('svg')
    if (!svg) return

    const previousTranslateTransform = translateWrapper.style.transform
    const previousScaleTransform = scaleWrapper.style.transform

    translateWrapper.style.transform = 'none'
    scaleWrapper.style.transform = 'none'
    svg.setAttribute('data-nav-measuring', 'true')

    try {
      const bbox = svg.getBBox()

      if (!bbox.width || !bbox.height || !size) {
        return
      }

      const viewBox = svg.viewBox?.baseVal
      const viewBoxWidth = viewBox?.width ?? bbox.width
      const viewBoxHeight = viewBox?.height ?? bbox.height
      const viewBoxX = viewBox?.x ?? bbox.x
      const viewBoxY = viewBox?.y ?? bbox.y

      const svgWidth = svg.clientWidth || translateWrapper.clientWidth || viewBoxWidth
      const svgHeight = svg.clientHeight || translateWrapper.clientHeight || viewBoxHeight

      const unitsToPxX = viewBoxWidth > 0 ? svgWidth / viewBoxWidth : svgWidth / bbox.width
      const unitsToPxY = viewBoxHeight > 0 ? svgHeight / viewBoxHeight : svgHeight / bbox.height

      if (
        !Number.isFinite(unitsToPxX) ||
        !Number.isFinite(unitsToPxY) ||
        unitsToPxX <= 0 ||
        unitsToPxY <= 0
      ) {
        return
      }

      const bboxWidthPx = bbox.width * unitsToPxX
      const bboxHeightPx = bbox.height * unitsToPxY

      if (!bboxWidthPx || !bboxHeightPx) {
        return
      }

      const desiredScale = Math.min(size / bboxWidthPx, size / bboxHeightPx)
      const nextScale = Number.isFinite(desiredScale) && desiredScale > 0 ? desiredScale : 1

      const viewBoxCenterX = viewBoxX + viewBoxWidth / 2
      const viewBoxCenterY = viewBoxY + viewBoxHeight / 2
      const bboxCenterX = bbox.x + bbox.width / 2
      const bboxCenterY = bbox.y + bbox.height / 2

      const deltaXUnits = viewBoxCenterX - bboxCenterX
      const deltaYUnits = viewBoxCenterY - bboxCenterY

      const nextTranslateX = deltaXUnits * unitsToPxX * nextScale
      const nextTranslateY = deltaYUnits * unitsToPxY * nextScale

      setScale((prev) => (Math.abs(prev - nextScale) > SCALE_EPSILON ? nextScale : prev))
      setTranslate((prev) =>
        Math.abs(prev.x - nextTranslateX) > TRANSLATE_EPSILON ||
        Math.abs(prev.y - nextTranslateY) > TRANSLATE_EPSILON
          ? { x: nextTranslateX, y: nextTranslateY }
          : prev
      )
    } catch {
      return
    } finally {
      svg.removeAttribute('data-nav-measuring')
      translateWrapper.style.transform = previousTranslateTransform
      scaleWrapper.style.transform = previousScaleTransform
    }
  }, [Icon, size])

  return (
    <span
      className={cn(
        "nav-icon grid w-12 h-12 place-items-center rounded-xl transition-all duration-200",
        "bg-transparent overflow-visible"
      )}
    >
      <span
        ref={translateWrapperRef}
        data-nav-icon-translate
        className="flex h-full w-full items-center justify-center"
        style={{ transform: `translate3d(${translate.x}px, ${translate.y}px, 0)` }}
      >
        <span
          ref={scaleWrapperRef}
          data-nav-icon-scale
          className="flex h-full w-full items-center justify-center"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
        >
          <Icon
            data-active={active}
            data-hovered={hovered ? 'true' : undefined}
            className={cn(
              "pointer-events-auto text-white/80 group-hover:text-white transition-all duration-200",
              "[filter:drop-shadow(0_0_4px_rgba(255,255,255,0.4))]",
              active && "text-white [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.7))]",
              className
            )}
            role="img"
            aria-hidden={false}
          />
        </span>
      </span>
    </span>
  )
}
