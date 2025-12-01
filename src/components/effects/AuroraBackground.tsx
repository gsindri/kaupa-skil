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
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />
        </div>
    )
}
