
import React from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  className?: string
}

export function Sparkline({ data, width = 60, height = 20, className = "" }: SparklineProps) {
  if (!data.length) return <div className={`${className} text-xs text-muted-foreground`}>No data</div>

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const isPositive = data[data.length - 1] >= data[0]
  
  return (
    <div className={`inline-flex items-center ${className}`}>
      <svg width={width} height={height} className="mr-1">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"}
          strokeWidth="1.5"
          className="opacity-80"
        />
      </svg>
      <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '↗' : '↘'}
      </span>
    </div>
  )
}
