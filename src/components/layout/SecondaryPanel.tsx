import React from 'react'

interface SecondaryPanelProps {
  children?: React.ReactNode
}

export function SecondaryPanel({ children }: SecondaryPanelProps) {
  return <div className="h-full overflow-y-auto">{children}</div>
}

