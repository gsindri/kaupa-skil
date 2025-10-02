import { ArrowUpRight, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useAlerts } from '@/hooks/useAlerts'
import { alertSeverityTokens } from '@/components/dashboard/status-tokens'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

export function AlertsWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const { alerts, isLoading } = useAlerts()
  const trackTelemetry = useDashboardTelemetry()
  const navigate = useNavigate()

  if (isLoading) {
    return <WidgetLoadingState rows={3} />
  }

  if (!alerts || alerts.length === 0) {
    return (
      <WidgetEmptyState
        title="All clear"
        description="We’ll surface supplier issues, pricing anomalies, and sync errors here."
        actionLabel="View all alerts"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'alerts', action: 'view-all' })
          navigate('/?tab=alerts')
        }}
      />
    )
  }

  const topAlerts = alerts.slice(0, 3)

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
          <BellRing className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Active alerts</p>
          <p className="text-3xl font-semibold text-foreground">{alerts.length}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {topAlerts.map((alert) => {
          const severity = alertSeverityTokens[alert.severity]
          return (
            <li
              key={alert.id}
              className="flex items-start justify-between rounded-2xl bg-muted/50 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{alert.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${severity.badge}`}>
                {severity.label}
              </span>
            </li>
          )
        })}
      </ul>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        disabled={isInEditMode}
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'alerts', action: 'view-all' })
          navigate('/?tab=alerts')
        }}
      >
        View all alerts
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
