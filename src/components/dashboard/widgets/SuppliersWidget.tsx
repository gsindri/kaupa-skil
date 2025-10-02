import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, UsersRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WidgetEmptyState, WidgetLoadingState } from './WidgetStates'
import { useSupplierConnectionSummary } from '@/hooks/useSupplierConnectionSummary'
import type { DashboardWidgetComponentProps } from '../widget-types'
import { useDashboardTelemetry } from '@/hooks/useDashboardTelemetry'
import { formatDistanceToNow } from 'date-fns'

const HEALTH_TOKENS: Record<string, { label: string; badge: string }> = {
  success: { label: 'Healthy', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  warning: { label: 'Action needed', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  danger: { label: 'Disconnected', badge: 'bg-rose-100 text-rose-700 border-rose-200' },
  unknown: { label: 'Sync pending', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export function SuppliersWidget({ isInEditMode }: DashboardWidgetComponentProps) {
  const trackTelemetry = useDashboardTelemetry()
  const navigate = useNavigate()
  const { data, isPending } = useSupplierConnectionSummary()

  const statusBadge = useMemo(() => {
    if (!data) return HEALTH_TOKENS.unknown
    return HEALTH_TOKENS[data.lastSyncHealth] ?? HEALTH_TOKENS.unknown
  }, [data])

  if (isPending) {
    return <WidgetLoadingState variant="stat" />
  }

  if (!data || data.supplierCount === 0) {
    return (
      <WidgetEmptyState
        title="No suppliers linked yet"
        description="Connect a supplier to sync catalogs, delivery windows, and negotiated pricing."
        actionLabel="Connect supplier"
        onAction={() => {
          trackTelemetry('cta_clicked', { widget: 'suppliers', action: 'connect' })
          navigate('/suppliers')
        }}
      />
    )
  }

  const syncLabel = data.lastSyncAt
    ? `Last sync ${formatDistanceToNow(new Date(data.lastSyncAt), { addSuffix: true })}`
    : 'Sync scheduled'

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <UsersRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Linked suppliers</p>
            <p className="text-2xl font-semibold text-foreground">
              {data.linkedCount} <span className="text-base font-normal text-muted-foreground">/ {data.supplierCount}</span>
            </p>
          </div>
        </div>
        <Badge className={`border ${statusBadge.badge}`}>{statusBadge.label}</Badge>
      </div>

      <dl className="mt-6 grid gap-4 text-sm">
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
          <dt className="text-muted-foreground">Pending invites</dt>
          <dd className="text-base font-semibold text-foreground">{data.pendingInvites}</dd>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="text-sm font-medium text-muted-foreground">{syncLabel}</dd>
        </div>
      </dl>

      <Button
        size="lg"
        className="mt-6 inline-flex items-center justify-center gap-2"
        onClick={() => {
          trackTelemetry('cta_clicked', { widget: 'suppliers', action: 'open_hub' })
          navigate('/suppliers')
        }}
        disabled={isInEditMode}
      >
        Open supplier hub
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
