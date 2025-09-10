import React from 'react'

interface LayoutState {
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
  railExpanded: boolean
  setRailExpanded: (open: boolean) => void
}

const LayoutContext = React.createContext<LayoutState | undefined>(undefined)

const STORAGE_KEY = 'qb/layout-state'

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = React.useState(false)
  const [railExpanded, setRailExpanded] = React.useState(false)

  // load persisted state
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed.panelOpen === 'boolean') setPanelOpen(parsed.panelOpen)
        if (typeof parsed.railExpanded === 'boolean') setRailExpanded(parsed.railExpanded)
      }
    } catch (e) {
      console.warn('Failed to load layout state', e)
    }
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ panelOpen, railExpanded })
      )
    } catch (e) {
      console.warn('Failed to save layout state', e)
    }
  }, [panelOpen, railExpanded])

  // Update CSS variables
  React.useEffect(() => {
    const rail = railExpanded ? '220px' : '72px'
    const panel = panelOpen ? '300px' : '0px'
    const root = document.documentElement
    root.style.setProperty('--rail-w', rail)
    root.style.setProperty('--panel-w', panel)
    root.style.setProperty('--header-left', rail)
  }, [panelOpen, railExpanded])

  const value = React.useMemo(
    () => ({ panelOpen, setPanelOpen, railExpanded, setRailExpanded }),
    [panelOpen, railExpanded]
  )

  return (
    <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = React.useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider')
  return ctx
}

