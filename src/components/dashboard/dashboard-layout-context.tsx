/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'
import {
  fetchDashboardLayout,
  listDashboardPresets,
  upsertDashboardLayout,
} from '@/services/dashboardLayoutService'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import {
  DASHBOARD_SECTIONS,
  type DashboardSectionId,
  type DashboardWidgetDescriptor,
  type DashboardWidgetSize,
} from './widget-types'

type DashboardWidgetMeta = {
  id: string
  size: DashboardWidgetSize
  visible: boolean
  sectionId: DashboardSectionId
}

export interface DashboardSectionLayout {
  id: DashboardSectionId
  title: string
  widgetIds: string[]
}

interface DashboardLayoutState {
  presetName: string
  sections: DashboardSectionLayout[]
  widgetMeta: Record<string, DashboardWidgetMeta>
}

interface MoveWidgetPayload {
  widgetId: string
  toSectionId: DashboardSectionId
  targetIndex: number
}

interface AddWidgetPayload {
  widgetId: string
  sectionId: DashboardSectionId
  size?: DashboardWidgetSize
  targetIndex?: number
}

type DashboardLayoutAction =
  | { type: 'HYDRATE'; state: DashboardLayoutState }
  | { type: 'SET_WIDGET_SIZE'; widgetId: string; size: DashboardWidgetSize }
  | { type: 'SET_WIDGET_VISIBILITY'; widgetId: string; visible: boolean }
  | { type: 'MOVE_WIDGET'; payload: MoveWidgetPayload }
  | { type: 'ADD_WIDGET'; payload: AddWidgetPayload }
  | { type: 'REMOVE_WIDGET'; widgetId: string }

const DEFAULT_WIDGET_DEFAULTS: Record<string, { size: DashboardWidgetSize; section: DashboardSectionId }> = {
  suppliers: { size: 'M', section: 'operations' },
  deliveries: { size: 'M', section: 'operations' },
  'low-stock': { size: 'M', section: 'inventory' },
  'smart-reorder': { size: 'M', section: 'inventory' },
  'spend-mtd': { size: 'M', section: 'finance' },
  'invoice-status': { size: 'M', section: 'finance' },
  'budget-tracker': { size: 'L', section: 'finance' },
  approvals: { size: 'M', section: 'team' },
  'notes-shortcuts': { size: 'M', section: 'team' },
  alerts: { size: 'M', section: 'intelligence' },
  'supplier-scorecard': { size: 'M', section: 'intelligence' },
  'price-trends': { size: 'L', section: 'intelligence' },
  'delivery-heatmap': { size: 'L', section: 'operations' },
  'seasonal-insight': { size: 'S', section: 'intelligence' },
}

const DEFAULT_SECTIONS: DashboardSectionLayout[] = DASHBOARD_SECTIONS.map((section) => ({
  id: section.id,
  title: section.title,
  widgetIds: [],
}))

function cloneSections(sections: DashboardSectionLayout[]) {
  return sections.map((section) => ({ ...section, widgetIds: [...section.widgetIds] }))
}

function normalizeState(state: DashboardLayoutState): DashboardLayoutState {
  const sectionMap = new Map<DashboardSectionId, DashboardSectionLayout>()
  DEFAULT_SECTIONS.forEach((section) => {
    sectionMap.set(section.id, { ...section, widgetIds: [] })
  })

  state.sections.forEach((section) => {
    const target = sectionMap.get(section.id)
    if (!target) return
    const seen = new Set<string>()
    section.widgetIds.forEach((widgetId) => {
      if (seen.has(widgetId)) return
      seen.add(widgetId)
      target.widgetIds.push(widgetId)
    })
  })

  const widgetMeta: Record<string, DashboardWidgetMeta> = {}

  Object.entries(state.widgetMeta).forEach(([widgetId, meta]) => {
    const defaults = DEFAULT_WIDGET_DEFAULTS[widgetId] ?? {
      size: 'M' as DashboardWidgetSize,
      section: 'operations' as DashboardSectionId,
    }

    widgetMeta[widgetId] = {
      id: widgetId,
      size: (meta.size ?? defaults.size) as DashboardWidgetSize,
      visible: meta.visible ?? false,
      sectionId: (meta.sectionId ?? defaults.section) as DashboardSectionId,
    }
  })

  Object.entries(DEFAULT_WIDGET_DEFAULTS).forEach(([widgetId, defaults]) => {
    if (widgetMeta[widgetId]) return
    widgetMeta[widgetId] = {
      id: widgetId,
      size: defaults.size,
      visible: false,
      sectionId: defaults.section,
    }
  })

  sectionMap.forEach((section, sectionId) => {
    section.widgetIds = section.widgetIds.filter((widgetId) => {
      const meta = widgetMeta[widgetId]
      if (!meta) return false
      meta.sectionId = sectionId
      return meta.visible !== false
    })
  })

  Object.values(widgetMeta).forEach((meta) => {
    if (!meta.visible) return
    const section = sectionMap.get(meta.sectionId)
    if (!section) return
    if (!section.widgetIds.includes(meta.id)) {
      section.widgetIds.push(meta.id)
    }
  })

  return {
    presetName: state.presetName,
    sections: Array.from(sectionMap.values()),
    widgetMeta,
  }
}

function stateToDescriptors(state: DashboardLayoutState): DashboardWidgetDescriptor[] {
  const descriptors: DashboardWidgetDescriptor[] = []

  state.sections.forEach((section) => {
    section.widgetIds.forEach((widgetId, index) => {
      const meta = state.widgetMeta[widgetId]
      if (!meta) return
      descriptors.push({
        id: widgetId,
        type: widgetId,
        size: meta.size,
        section: section.id,
        order: index,
        settings: { visible: meta.visible },
      })
    })
  })

  Object.values(state.widgetMeta).forEach((meta) => {
    if (state.sections.some((section) => section.widgetIds.includes(meta.id))) return
    descriptors.push({
      id: meta.id,
      type: meta.id,
      size: meta.size,
      section: meta.sectionId,
      order: -1,
      settings: { visible: meta.visible },
    })
  })

  return descriptors
}

function createStateFromDescriptors(
  descriptors: DashboardWidgetDescriptor[] | null,
  presetName: string
): DashboardLayoutState {
  if (!descriptors || descriptors.length === 0) {
    return buildPresetState(presetName, {})
  }

  const sections = cloneSections(DEFAULT_SECTIONS)
  const widgetMeta: Record<string, DashboardWidgetMeta> = {}

  const sorted = [...descriptors].sort((a, b) => {
    if (a.section === b.section) {
      return (a.order ?? 0) - (b.order ?? 0)
    }
    return String(a.section).localeCompare(String(b.section))
  })

  sorted.forEach((descriptor) => {
    const defaults = DEFAULT_WIDGET_DEFAULTS[descriptor.id]
    const sectionId = (descriptor.section ?? defaults?.section ?? 'operations') as DashboardSectionId
    const section = sections.find((item) => item.id === sectionId)
    if (!section) return

    const visible = descriptor.settings && typeof descriptor.settings === 'object'
      ? (descriptor.settings as Record<string, unknown>).visible !== false
      : true

    if (visible) {
      section.widgetIds.push(descriptor.id)
    }

    widgetMeta[descriptor.id] = {
      id: descriptor.id,
      size: descriptor.size ?? defaults?.size ?? 'M',
      visible,
      sectionId,
    }
  })

  return normalizeState({ presetName, sections, widgetMeta })
}

function buildPresetState(
  presetName: string,
  config: Partial<Record<DashboardSectionId, string[]>>
): DashboardLayoutState {
  const sections = cloneSections(DEFAULT_SECTIONS)
  const widgetMeta: Record<string, DashboardWidgetMeta> = {}

  sections.forEach((section) => {
    const widgets = config[section.id] ?? []
    section.widgetIds = widgets.slice()
    widgets.forEach((widgetId) => {
      const defaults = DEFAULT_WIDGET_DEFAULTS[widgetId]
      widgetMeta[widgetId] = {
        id: widgetId,
        size: defaults?.size ?? 'M',
        visible: true,
        sectionId: defaults?.section ?? section.id,
      }
    })
  })

  Object.entries(DEFAULT_WIDGET_DEFAULTS).forEach(([widgetId, defaults]) => {
    if (widgetMeta[widgetId]) return
    widgetMeta[widgetId] = {
      id: widgetId,
      size: defaults.size,
      visible: false,
      sectionId: defaults.section,
    }
  })

  return normalizeState({ presetName, sections, widgetMeta })
}

const DEFAULT_PRESETS: Record<string, DashboardLayoutState> = {
  Manager: buildPresetState('Manager', {
    operations: ['suppliers', 'deliveries'],
    inventory: ['low-stock', 'smart-reorder'],
    finance: ['spend-mtd', 'invoice-status'],
    team: ['approvals', 'notes-shortcuts'],
    intelligence: ['alerts', 'supplier-scorecard'],
  }),
  Procurement: buildPresetState('Procurement', {
    operations: ['suppliers', 'deliveries', 'delivery-heatmap'],
    inventory: ['low-stock', 'smart-reorder'],
    finance: ['spend-mtd'],
    team: ['approvals'],
    intelligence: ['alerts', 'price-trends'],
  }),
  Finance: buildPresetState('Finance', {
    operations: ['suppliers'],
    inventory: ['low-stock'],
    finance: ['spend-mtd', 'invoice-status', 'budget-tracker'],
    team: ['approvals'],
    intelligence: ['alerts', 'price-trends', 'seasonal-insight'],
  }),
}

const INITIAL_STATE = DEFAULT_PRESETS.Manager

function reducer(state: DashboardLayoutState, action: DashboardLayoutAction): DashboardLayoutState {
  switch (action.type) {
    case 'HYDRATE': {
      return normalizeState({ ...action.state })
    }
    case 'SET_WIDGET_SIZE': {
      const meta = state.widgetMeta[action.widgetId]
      if (!meta || meta.size === action.size) return state
      return normalizeState({
        ...state,
        widgetMeta: {
          ...state.widgetMeta,
          [action.widgetId]: { ...meta, size: action.size },
        },
      })
    }
    case 'SET_WIDGET_VISIBILITY': {
      const meta = state.widgetMeta[action.widgetId] ?? {
        id: action.widgetId,
        size: DEFAULT_WIDGET_DEFAULTS[action.widgetId]?.size ?? 'M',
        visible: false,
        sectionId: DEFAULT_WIDGET_DEFAULTS[action.widgetId]?.section ?? 'operations',
      }
      const sections = state.sections.map((section) => {
        if (section.id !== meta.sectionId) {
          return { ...section, widgetIds: section.widgetIds.filter((id) => id !== action.widgetId) }
        }
        const without = section.widgetIds.filter((id) => id !== action.widgetId)
        if (action.visible) {
          return { ...section, widgetIds: [...without, action.widgetId] }
        }
        return { ...section, widgetIds: without }
      })

      return normalizeState({
        ...state,
        sections,
        widgetMeta: {
          ...state.widgetMeta,
          [action.widgetId]: { ...meta, visible: action.visible },
        },
      })
    }
    case 'MOVE_WIDGET': {
      const { widgetId, toSectionId, targetIndex } = action.payload
      const meta = state.widgetMeta[widgetId] ?? {
        id: widgetId,
        size: DEFAULT_WIDGET_DEFAULTS[widgetId]?.size ?? 'M',
        visible: true,
        sectionId: toSectionId,
      }

      const sections = state.sections.map((section) => {
        let widgetIds = section.widgetIds.filter((id) => id !== widgetId)
        if (section.id === toSectionId) {
          const index = Math.min(Math.max(targetIndex, 0), widgetIds.length)
          widgetIds = [...widgetIds.slice(0, index), widgetId, ...widgetIds.slice(index)]
        }
        return { ...section, widgetIds }
      })

      return normalizeState({
        ...state,
        sections,
        widgetMeta: {
          ...state.widgetMeta,
          [widgetId]: { ...meta, visible: true, sectionId: toSectionId },
        },
      })
    }
    case 'ADD_WIDGET': {
      const { widgetId, sectionId, size, targetIndex } = action.payload
      const existingMeta = state.widgetMeta[widgetId]
      const nextMeta: DashboardWidgetMeta = {
        id: widgetId,
        size: size ?? existingMeta?.size ?? DEFAULT_WIDGET_DEFAULTS[widgetId]?.size ?? 'M',
        visible: true,
        sectionId,
      }

      const sections = state.sections.map((section) => {
        if (section.id !== sectionId) {
          return { ...section, widgetIds: section.widgetIds.filter((id) => id !== widgetId) }
        }
        const without = section.widgetIds.filter((id) => id !== widgetId)
        const index = typeof targetIndex === 'number' ? Math.min(Math.max(targetIndex, 0), without.length) : without.length
        const widgetIds = [...without.slice(0, index), widgetId, ...without.slice(index)]
        return { ...section, widgetIds }
      })

      return normalizeState({
        ...state,
        sections,
        widgetMeta: {
          ...state.widgetMeta,
          [widgetId]: nextMeta,
        },
      })
    }
    case 'REMOVE_WIDGET': {
      if (!state.widgetMeta[action.widgetId]) {
        return state
      }
      const sections = state.sections.map((section) => ({
        ...section,
        widgetIds: section.widgetIds.filter((id) => id !== action.widgetId),
      }))

      return normalizeState({
        ...state,
        sections,
        widgetMeta: {
          ...state.widgetMeta,
          [action.widgetId]: {
            ...state.widgetMeta[action.widgetId],
            visible: false,
          },
        },
      })
    }
    default:
      return state
  }
}

interface DashboardLayoutContextValue extends DashboardLayoutState {
  isHydrated: boolean
  isLoading: boolean
  isSaving: boolean
  currentPreset: string
  availablePresets: string[]
  moveWidget: (payload: MoveWidgetPayload) => void
  setWidgetSize: (widgetId: string, size: DashboardWidgetSize) => void
  setWidgetVisibility: (widgetId: string, visible: boolean) => void
  addWidget: (payload: AddWidgetPayload) => void
  removeWidget: (widgetId: string) => void
  applyPreset: (presetName: string) => void
  savePreset: (presetName: string) => Promise<void>
}

const DashboardLayoutContext = createContext<DashboardLayoutContextValue | undefined>(undefined)

export function DashboardLayoutProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const trackTelemetry = useDashboardTelemetry()
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [currentPreset, setCurrentPreset] = useState<string>(INITIAL_STATE.presetName)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const workspaceId = profile?.tenant_id ?? null
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSavedSignatureRef = useRef<string | null>(null)
  const lastHydratedSignatureRef = useRef<string | null>(null)

  const layoutQuery = useQuery({
    queryKey: queryKeys.dashboard.layout(user?.id ?? null, workspaceId, currentPreset),
    queryFn: async () => {
      if (!user?.id) return null
      return fetchDashboardLayout(user.id, workspaceId, currentPreset)
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const presetsQuery = useQuery({
    queryKey: queryKeys.dashboard.presets(user?.id ?? null, workspaceId),
    queryFn: async () => {
      if (!user?.id) return [] as string[]
      return listDashboardPresets(user.id, workspaceId)
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  })

  useEffect(() => {
    if (layoutQuery.isPending) return

    const remoteState = layoutQuery.data
      ? createStateFromDescriptors(layoutQuery.data.widgets, currentPreset)
      : DEFAULT_PRESETS[currentPreset] ?? DEFAULT_PRESETS.Manager

    const signature = JSON.stringify(stateToDescriptors(remoteState))
    if (signature === lastHydratedSignatureRef.current && isHydrated) {
      return
    }

    dispatch({ type: 'HYDRATE', state: remoteState })
    lastHydratedSignatureRef.current = signature
    lastSavedSignatureRef.current = signature
    setIsHydrated(true)
  }, [currentPreset, isHydrated, layoutQuery.data, layoutQuery.isPending])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    if (!user?.id) return

    const descriptors = stateToDescriptors(state)
    const signature = JSON.stringify(descriptors)
    if (signature === lastSavedSignatureRef.current) return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        await upsertDashboardLayout({
          user_id: user.id,
          workspace_id: workspaceId,
          preset_name: currentPreset,
          widgets: descriptors,
        })
        lastSavedSignatureRef.current = signature
      } catch (error) {
        console.warn('Failed to auto-save dashboard layout', error)
      } finally {
        setIsSaving(false)
      }
    }, 400)
  }, [currentPreset, isHydrated, state, user?.id, workspaceId])

  const moveWidget = useCallback(
    (payload: MoveWidgetPayload) => {
      dispatch({ type: 'MOVE_WIDGET', payload })
      trackTelemetry('widget_reordered', {
        widgetId: payload.widgetId,
        section: payload.toSectionId,
        targetIndex: payload.targetIndex,
      })
    },
    [trackTelemetry]
  )

  const setWidgetSize = useCallback(
    (widgetId: string, size: DashboardWidgetSize) => {
      dispatch({ type: 'SET_WIDGET_SIZE', widgetId, size })
      trackTelemetry('widget_resized', { widgetId, size })
    },
    [trackTelemetry]
  )

  const setWidgetVisibility = useCallback(
    (widgetId: string, visible: boolean) => {
      dispatch({ type: 'SET_WIDGET_VISIBILITY', widgetId, visible })
      trackTelemetry(visible ? 'widget_added' : 'widget_removed', { widgetId })
    },
    [trackTelemetry]
  )

  const addWidget = useCallback(
    (payload: AddWidgetPayload) => {
      dispatch({ type: 'ADD_WIDGET', payload })
      trackTelemetry('widget_added', { widgetId: payload.widgetId, section: payload.sectionId })
    },
    [trackTelemetry]
  )

  const removeWidget = useCallback(
    (widgetId: string) => {
      dispatch({ type: 'REMOVE_WIDGET', widgetId })
      trackTelemetry('widget_removed', { widgetId })
    },
    [trackTelemetry]
  )

  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = DEFAULT_PRESETS[presetName]
      if (preset) {
        dispatch({ type: 'HYDRATE', state: preset })
        lastHydratedSignatureRef.current = JSON.stringify(stateToDescriptors(preset))
        lastSavedSignatureRef.current = lastHydratedSignatureRef.current
        setIsHydrated(true)
      } else {
        lastHydratedSignatureRef.current = null
        lastSavedSignatureRef.current = null
        setIsHydrated(false)
      }
      setCurrentPreset(presetName)
      trackTelemetry('preset_applied', { preset: presetName })
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.layout(user?.id ?? null, workspaceId, presetName),
      })
    },
    [queryClient, trackTelemetry, user?.id, workspaceId]
  )

  const savePreset = useCallback(
    async (presetName: string) => {
      if (!user?.id) return
      const descriptors = stateToDescriptors(state)
      try {
        await upsertDashboardLayout({
          user_id: user.id,
          workspace_id: workspaceId,
          preset_name: presetName,
          widgets: descriptors,
        })
        lastSavedSignatureRef.current = JSON.stringify(descriptors)
        setCurrentPreset(presetName)
        trackTelemetry('preset_saved', { preset: presetName })
        await queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.presets(user.id, workspaceId),
        })
      } catch (error) {
        console.warn('Failed to save preset', error)
      }
    },
    [queryClient, state, trackTelemetry, user?.id, workspaceId]
  )

  const availablePresets = useMemo(() => {
    const base = new Set(Object.keys(DEFAULT_PRESETS))
    presetsQuery.data?.forEach((preset) => base.add(preset))
    return Array.from(base)
  }, [presetsQuery.data])

  const value = useMemo<DashboardLayoutContextValue>(
    () => ({
      ...state,
      isHydrated,
      isLoading: layoutQuery.isPending,
      isSaving,
      currentPreset,
      availablePresets,
      moveWidget,
      setWidgetSize,
      setWidgetVisibility,
      addWidget,
      removeWidget,
      applyPreset,
      savePreset,
    }),
    [
      state,
      isHydrated,
      layoutQuery.isPending,
      isSaving,
      currentPreset,
      availablePresets,
      moveWidget,
      setWidgetSize,
      setWidgetVisibility,
      addWidget,
      removeWidget,
      applyPreset,
      savePreset,
    ]
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
