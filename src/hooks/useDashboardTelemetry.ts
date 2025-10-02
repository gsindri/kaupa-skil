import { useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'

type DashboardTelemetryEventName =
  | 'dashboard_enter'
  | 'edit_mode_on'
  | 'edit_mode_off'
  | 'widget_added'
  | 'widget_removed'
  | 'widget_resized'
  | 'widget_reordered'
  | 'preset_saved'
  | 'preset_applied'
  | 'cta_clicked'

export function useDashboardTelemetry() {
  const { user, profile } = useAuth()

  return useCallback(
    async (eventName: DashboardTelemetryEventName, properties?: Record<string, unknown>) => {
      try {
        await supabase.from('dashboard_telemetry_events').insert({
          user_id: user?.id ?? null,
          workspace_id: profile?.tenant_id ?? null,
          event_name: eventName,
          properties: properties ? JSON.parse(JSON.stringify(properties)) : {},
        })
      } catch (error) {
        console.debug('Telemetry emit failed', error)
      }
    },
    [profile?.tenant_id, user?.id]
  )
}
