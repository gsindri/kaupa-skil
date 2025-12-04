import React from 'react'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
    className?: string
}

export function AuroraBackground({ className }: AuroraBackgroundProps) {
    return (
        <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
            {/* Aurora Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/40 rounded-full blur-[120px] animate-pulse-slow" />
            <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-orange-300/40 rounded-full blur-[100px] animate-blob" />
            <div className="absolute top-[20%] right-[20%] w-[35%] h-[35%] bg-teal-300/30 rounded-full blur-[100px] animate-float" />

            {/* Subtle Grid Overlay */}

        </div>
    )
}
