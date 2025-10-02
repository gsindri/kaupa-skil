import { supabase } from '@/integrations/supabase/client'
import type { DashboardWidgetDescriptor } from '@/components/dashboard/widget-types'

export interface DashboardLayoutRecord {
  user_id: string
  workspace_id: string | null
  preset_name: string
  widgets: DashboardWidgetDescriptor[]
  updated_at?: string
}

export async function fetchDashboardLayout(
  userId: string,
  workspaceId: string | null,
  presetName: string
): Promise<DashboardLayoutRecord | null> {
  try {
    let query = supabase
      .from('dashboard_layouts')
      .select('user_id, workspace_id, preset_name, widgets, updated_at')
      .eq('user_id', userId)
      .eq('preset_name', presetName)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    } else {
      query = query.is('workspace_id', null)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.warn('Failed to fetch dashboard layout', error)
      return null
    }

    if (!data) return null

    return {
      user_id: data.user_id,
      workspace_id: data.workspace_id,
      preset_name: data.preset_name,
      widgets: Array.isArray(data.widgets) ? (data.widgets as DashboardWidgetDescriptor[]) : [],
      updated_at: data.updated_at ?? undefined,
    }
  } catch (error) {
    console.warn('Unexpected error fetching dashboard layout', error)
    return null
  }
}

export async function upsertDashboardLayout(record: DashboardLayoutRecord) {
  try {
    const payload = {
      user_id: record.user_id,
      workspace_id: record.workspace_id,
      preset_name: record.preset_name,
      widgets: record.widgets,
    }

    const { error } = await supabase
      .from('dashboard_layouts')
      .upsert(payload, { onConflict: 'user_id,workspace_id,preset_name' })

    if (error) {
      console.warn('Failed to persist dashboard layout', error)
      throw error
    }
  } catch (error) {
    console.warn('Unexpected error persisting dashboard layout', error)
    throw error
  }
}

export async function listDashboardPresets(userId: string, workspaceId: string | null) {
  try {
    let query = supabase
      .from('dashboard_layouts')
      .select('preset_name')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    } else {
      query = query.is('workspace_id', null)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Failed to list dashboard presets', error)
      return [] as string[]
    }

    const presets = new Set<string>()
    data?.forEach((row: any) => {
      if (row?.preset_name) presets.add(row.preset_name as string)
    })

    return Array.from(presets)
  } catch (error) {
    console.warn('Unexpected error listing dashboard presets', error)
    return [] as string[]
  }
}
