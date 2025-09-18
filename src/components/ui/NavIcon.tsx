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
  const svgRef = useRef<SVGSVGElement>(null)
  const [transforms, setTransforms] = useState({ scale: 1, translateX: 0, translateY: 0 })
  const [isMeasuring, setIsMeasuring] = useState(true)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    setIsMeasuring(true)
    
    // Use requestAnimationFrame to ensure SVG is rendered
    const measureIcon = () => {
      try {
        const viewBox = svg.viewBox.baseVal
        const viewBoxWidth = viewBox.width || size
        const viewBoxHeight = viewBox.height || size

        // Get the actual content bounds
        const bbox = svg.getBBox()
        
        // Calculate scale to fit content within target size
        const contentWidth = bbox.width || viewBoxWidth
        const contentHeight = bbox.height || viewBoxHeight
        const maxDimension = Math.max(contentWidth, contentHeight)
        
        // Scale factor to make the visual content fill the target size
        const scale = maxDimension > 0 ? (size * 0.8) / maxDimension : 1
        
        // Calculate translation to center the content
        const viewBoxCenterX = viewBoxWidth / 2
        const viewBoxCenterY = viewBoxHeight / 2
        const contentCenterX = bbox.x + bbox.width / 2
        const contentCenterY = bbox.y + bbox.height / 2
        
        // Calculate translation in viewBox coordinates
        const translateX = (viewBoxCenterX - contentCenterX) * (size / viewBoxWidth)
        const translateY = (viewBoxCenterY - contentCenterY) * (size / viewBoxHeight)
        
        setTransforms({ scale, translateX, translateY })
      } catch (error) {
        // Fallback if getBBox fails
        console.warn('NavIcon measurement failed:', error)
        setTransforms({ scale: 1, translateX: 0, translateY: 0 })
      } finally {
        setIsMeasuring(false)
      }
    }

    requestAnimationFrame(measureIcon)
  }, [size])

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
          style={{ 
            transform: `translate(${transforms.translateX}px, ${transforms.translateY}px)`,
            display: 'block'
          }}
        >
          <Icon
            ref={svgRef}
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
            style={{
              transition: isMeasuring ? 'none' : undefined
            }}
            role="img"
            aria-hidden={false}
            aria-label={label}
          />
        </span>
      </span>
    </span>
  )
}
