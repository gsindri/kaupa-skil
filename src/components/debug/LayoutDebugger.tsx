
interface LayoutDebuggerProps {
  show?: boolean
}

export function LayoutDebugger({ show = false }: LayoutDebuggerProps) {
  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-0 border-2 border-dashed border-orange-400/60 bg-transparent" />
  )
}
