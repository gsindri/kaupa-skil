
import { useSidebar } from '@/components/ui/use-sidebar'

interface LayoutDebuggerProps {
  show?: boolean
}

export function LayoutDebugger({ show = false }: LayoutDebuggerProps) {
  const { state, open, isMobile } = useSidebar()
  
  if (!show) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono space-y-1">
      <div>Sidebar State: {state}</div>
      <div>Open: {String(open)}</div>
      <div>Mobile: {String(isMobile)}</div>
      <div>
        CSS Var: {isMobile 
          ? '3rem' 
          : open 
            ? '16rem' 
            : '0rem'
        }
      </div>
      <div className="text-green-400">
        Expected Width: {open ? '256px' : '0px'}
      </div>
    </div>
  )
}
