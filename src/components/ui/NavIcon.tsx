import React, { useRef, useEffect, useState } from 'react'
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
  const svgRef = useRef<SVGSVGElement>(null)
  const [transforms, setTransforms] = useState<{
    scale: number
    translateX: number
    translateY: number
  }>({ scale: 1, translateX: 0, translateY: 0 })

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    // Wait for next frame to ensure DOM is ready
    requestAnimationFrame(() => {
      try {
        // Get the viewBox dimensions
        const viewBox = svg.viewBox.baseVal
        const viewBoxWidth = viewBox.width || size
        const viewBoxHeight = viewBox.height || size

        // Get the actual content bounds
        const bbox = svg.getBBox()
        
        // Calculate the visual bounds
        const contentWidth = bbox.width || viewBoxWidth
        const contentHeight = bbox.height || viewBoxHeight
        const contentCenterX = bbox.x + contentWidth / 2
        const contentCenterY = bbox.y + contentHeight / 2
        
        // Calculate viewBox center
        const viewBoxCenterX = viewBox.x + viewBoxWidth / 2
        const viewBoxCenterY = viewBox.y + viewBoxHeight / 2
        
        // Calculate optimal scale to fit target size
        const maxDimension = Math.max(contentWidth, contentHeight)
        const targetSize = size
        const scale = maxDimension > 0 ? targetSize / maxDimension : 1
        
        // Calculate translation to center the content
        const translateX = (viewBoxCenterX - contentCenterX) * scale
        const translateY = (viewBoxCenterY - contentCenterY) * scale
        
        // Apply epsilon thresholds to avoid unnecessary transforms
        const finalScale = Math.abs(scale - 1) > SCALE_EPSILON ? scale : 1
        const finalTranslateX = Math.abs(translateX) > TRANSLATE_EPSILON ? translateX : 0
        const finalTranslateY = Math.abs(translateY) > TRANSLATE_EPSILON ? translateY : 0
        
        setTransforms({
          scale: finalScale,
          translateX: finalTranslateX,
          translateY: finalTranslateY
        })
      } catch (error) {
        // If getBBox fails, use default transforms
        setTransforms({ scale: 1, translateX: 0, translateY: 0 })
      }
    })
  }, [size])

  const hasTransforms = transforms.scale !== 1 || transforms.translateX !== 0 || transforms.translateY !== 0
  const transformStyle = hasTransforms 
    ? `translate(${transforms.translateX}px, ${transforms.translateY}px) scale(${transforms.scale})`
    : undefined

  return (
    <span
      className={cn(
        "nav-icon grid w-12 h-12 place-items-center rounded-xl transition-all duration-200",
        "bg-transparent overflow-visible"
      )}
    >
      <span className="flex h-full w-full items-center justify-center">
        <span
          className="flex items-center justify-center"
          style={{
            transform: transformStyle,
            transformOrigin: 'center center'
          }}
        >
          <Icon
            ref={svgRef}
            data-active={active}
            data-hovered={hovered ? 'true' : undefined}
            data-nav-measuring={transforms.scale === 1 && transforms.translateX === 0 && transforms.translateY === 0 ? 'true' : undefined}
            width={size}
            height={size}
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
