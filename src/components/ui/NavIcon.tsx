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
}

export function NavIcon({ Icon, active, size = 44, className, label }: IconProps) {
  const iconWrapperRef = React.useRef<HTMLSpanElement>(null)
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    const wrapper = iconWrapperRef.current
    if (!wrapper) return

    const svg = wrapper.querySelector('svg')
    if (!svg) return

    let bbox: DOMRect
    try {
      bbox = svg.getBBox()
    } catch {
      return
    }

    if (!bbox.width || !bbox.height || !size) {
      return
    }

    const viewBox = svg.viewBox?.baseVal
    const viewBoxWidth = viewBox?.width ?? 0
    const viewBoxHeight = viewBox?.height ?? 0

    const wrapperWidth = wrapper.clientWidth
    const wrapperHeight = wrapper.clientHeight

    const currentWidth = svg.clientWidth || wrapperWidth || viewBoxWidth || bbox.width
    const currentHeight = svg.clientHeight || wrapperHeight || viewBoxHeight || bbox.height

    const widthRatio = viewBoxWidth > 0 ? bbox.width / viewBoxWidth : 1
    const heightRatio = viewBoxHeight > 0 ? bbox.height / viewBoxHeight : 1

    const baseWidth = currentWidth * widthRatio
    const baseHeight = currentHeight * heightRatio

    if (!baseWidth || !baseHeight) {
      return
    }

    const desiredScale = Math.min(size / baseWidth, size / baseHeight)
    const nextScale = Math.max(Number.EPSILON, desiredScale)

    if (Number.isFinite(nextScale) && nextScale > 0 && Math.abs(nextScale - scale) > 0.01) {
      setScale(nextScale)
    }
  }, [Icon, scale, size])

  return (
    <span
      className={cn(
        "nav-icon grid w-12 h-12 place-items-center rounded-xl transition-all duration-200",
        "bg-transparent overflow-visible" // No background squares - let the icon shine and allow overflow
      )}
    >
      <span
        ref={iconWrapperRef}
        className="flex h-full w-full items-center justify-center"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        <Icon
          data-active={active}
          className={cn(
            "text-white/80 group-hover:text-white transition-all duration-200",
            // Soft glow without any square backgrounds
            "[filter:drop-shadow(0_0_4px_rgba(255,255,255,0.4))]",
            active && "text-white [filter:drop-shadow(0_0_6px_rgba(255,255,255,0.7))]",
            className
          )}
          style={{ pointerEvents: 'auto' }}
          role="img"
          aria-hidden={false}
        />
      </span>
    </span>
  )
}
