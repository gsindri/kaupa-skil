/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'

export type DashboardTileSize = 'small' | 'medium' | 'large'

export interface DashboardTileMeta {
  id: string
  size: DashboardTileSize
  visible: boolean
}

export interface DashboardSectionLayout {
  id: string
  title: string
  tileIds: string[]
}

interface DashboardLayoutState {
  sections: DashboardSectionLayout[]
  tileMeta: Record<string, DashboardTileMeta>
}

interface MoveTilePayload {
  tileId: string
  toSectionId: string
  targetIndex: number
}

interface DashboardLayoutContextValue extends DashboardLayoutState {
  moveTile: (payload: MoveTilePayload) => void
  setTileSize: (tileId: string, size: DashboardTileSize) => void
  setTileVisibility: (tileId: string, visible: boolean) => void
}

const DASHBOARD_LAYOUT_STORAGE_KEY = 'kaupa.dashboard.layout'

const DEFAULT_LAYOUT: DashboardLayoutState = {
  sections: [
    { id: 'operations', title: 'Operations', tileIds: ['suppliers', 'deliveries'] },
    { id: 'inventory', title: 'Inventory', tileIds: ['pantry'] },
    { id: 'finance', title: 'Finance', tileIds: ['spend'] },
    { id: 'team', title: 'Team', tileIds: ['team-activity'] },
    { id: 'intelligence', title: 'Intelligence', tileIds: ['analytics'] },
  ],
  tileMeta: {
    suppliers: { id: 'suppliers', size: 'medium', visible: true },
    deliveries: { id: 'deliveries', size: 'medium', visible: true },
    pantry: { id: 'pantry', size: 'small', visible: true },
    spend: { id: 'spend', size: 'medium', visible: true },
    'team-activity': { id: 'team-activity', size: 'medium', visible: true },
    analytics: { id: 'analytics', size: 'medium', visible: true },
  },
}

type DashboardLayoutAction =
  | { type: 'SET_TILE_SIZE'; tileId: string; size: DashboardTileSize }
  | { type: 'SET_TILE_VISIBILITY'; tileId: string; visible: boolean }
  | { type: 'MOVE_TILE'; payload: MoveTilePayload }

function normalizeState(state: DashboardLayoutState): DashboardLayoutState {
  const sections = DEFAULT_LAYOUT.sections.map((section) => {
    const existing = state.sections.find((item) => item.id === section.id)
    if (!existing) return section

    const filteredTileIds = Array.from(new Set(existing.tileIds.concat(section.tileIds)))

    return {
      id: section.id,
      title: section.title,
      tileIds: filteredTileIds,
    }
  })

  const tileMeta: Record<string, DashboardTileMeta> = { ...DEFAULT_LAYOUT.tileMeta }

  Object.entries(state.tileMeta).forEach(([tileId, meta]) => {
    if (!tileMeta[tileId]) {
      tileMeta[tileId] = { id: tileId, size: 'medium', visible: true }
    }

    tileMeta[tileId] = {
      ...tileMeta[tileId],
      ...meta,
      id: tileId,
    }
  })

  // Ensure that each tile listed in sections exists in tileMeta
  sections.forEach((section) => {
    section.tileIds = section.tileIds.filter((tileId) => {
      if (!tileMeta[tileId]) {
        tileMeta[tileId] = { id: tileId, size: 'medium', visible: true }
      }
      return true
    })
  })

  return { sections, tileMeta }
}

function reducer(state: DashboardLayoutState, action: DashboardLayoutAction): DashboardLayoutState {
  switch (action.type) {
    case 'SET_TILE_SIZE': {
      const { tileId, size } = action
      if (!state.tileMeta[tileId]) return state
      return {
        ...state,
        tileMeta: {
          ...state.tileMeta,
          [tileId]: {
            ...state.tileMeta[tileId],
            size,
          },
        },
      }
    }
    case 'SET_TILE_VISIBILITY': {
      const { tileId, visible } = action
      if (!state.tileMeta[tileId]) return state
      return {
        ...state,
        tileMeta: {
          ...state.tileMeta,
          [tileId]: {
            ...state.tileMeta[tileId],
            visible,
          },
        },
      }
    }
    case 'MOVE_TILE': {
      const { tileId, toSectionId, targetIndex } = action.payload
      const sections = state.sections.map((section) => ({ ...section, tileIds: [...section.tileIds] }))

      const fromSection = sections.find((section) => section.tileIds.includes(tileId))
      const toSection = sections.find((section) => section.id === toSectionId)
      if (!fromSection || !toSection) {
        return state
      }

      fromSection.tileIds = fromSection.tileIds.filter((id) => id !== tileId)

      const insertIndex = Math.max(0, Math.min(targetIndex, toSection.tileIds.length))
      toSection.tileIds.splice(insertIndex, 0, tileId)

      return {
        ...state,
        sections,
      }
    }
    default:
      return state
  }
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | undefined>(undefined)

function readStoredLayout(): DashboardLayoutState {
  if (typeof window === 'undefined') {
    return DEFAULT_LAYOUT
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY)
    if (!raw) return normalizeState(DEFAULT_LAYOUT)

    const parsed = JSON.parse(raw) as DashboardLayoutState
    return normalizeState(parsed)
  } catch (error) {
    console.warn('Failed to parse dashboard layout from storage', error)
    return normalizeState(DEFAULT_LAYOUT)
  }
}

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_LAYOUT, () => {
    return readStoredLayout()
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const moveTile = useCallback((payload: MoveTilePayload) => {
    dispatch({ type: 'MOVE_TILE', payload })
  }, [])

  const setTileSize = useCallback((tileId: string, size: DashboardTileSize) => {
    dispatch({ type: 'SET_TILE_SIZE', tileId, size })
  }, [])

  const setTileVisibility = useCallback((tileId: string, visible: boolean) => {
    dispatch({ type: 'SET_TILE_VISIBILITY', tileId, visible })
  }, [])

  const value = useMemo<DashboardLayoutContextValue>(
    () => ({
      sections: state.sections,
      tileMeta: state.tileMeta,
      moveTile,
      setTileSize,
      setTileVisibility,
    }),
    [moveTile, setTileSize, setTileVisibility, state.sections, state.tileMeta]
  )

  return <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>
}

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext)
  if (!context) {
    throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider')
  }
  return context
}
