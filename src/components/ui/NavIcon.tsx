import React from 'react'
import { cn } from "@/lib/utils"

type IconProps = {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  active?: boolean
  size?: number
  sizePercent?: string
  className?: string
  label: string
}

export function NavIcon({ Icon, active, size = 28, sizePercent, className, label }: IconProps) {
  return (
    <span
      className={cn(
        "grid size-12 place-items-center rounded-xl transition-all duration-200",
        "bg-transparent" // No background squares - let the icon shine
      )}
      aria-label={label}
    >
      <Icon
        {...(sizePercent 
          ? {} 
          : { width: size, height: size }
        )}
        data-active={active}
        className={cn(
          "text-white/80 group-hover:text-white transition-all duration-200",
          // Soft glow without any square backgrounds
          "[filter:drop-shadow(0_0_6px_rgba(255,255,255,0.6))]",
          active && "text-white [filter:drop-shadow(0_0_10px_rgba(255,255,255,0.9))]",
          // Percentage sizing with enhanced stroke and overflow handling
          sizePercent && `size-[${sizePercent}] stroke-[2] overflow-visible`,
          className
        )}
        role="img"
        aria-hidden={false}
      />
    </span>
  )
}