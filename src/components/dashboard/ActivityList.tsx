import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/useAuth'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { formatDistanceToNow, subDays } from 'date-fns'

export function ActivityList() {
  const { profile } = useAuth()
  const { auditLogs = [], isLoading } = useAuditLogs({ tenantId: profile?.tenant_id })

  const metrics = useMemo(() => {
    const now = new Date()
    const weekAgo = subDays(now, 7)

    const orders = auditLogs.filter(
      (log: any) =>
        typeof log.action === 'string' &&
        (log.action.includes('order') || log.entity_type === 'order')
    )

    const ordersThisWeek = orders.filter((log: any) => {
      const createdAt = log.created_at ? new Date(log.created_at) : null
      return createdAt ? createdAt >= weekAgo : false
    }).length

    const lastOrder = orders.length > 0
      ? orders.reduce((latest: any, current: any) =>
          !latest || new Date(current.created_at) > new Date(latest.created_at)
            ? current
            : latest,
        null)
      : null

    const activeUsers = new Set(
      auditLogs
        .map((log: any) => log.actor_id)
        .filter(Boolean)
    ).size

    const lastActivity = auditLogs[0]?.created_at
      ? formatDistanceToNow(new Date(auditLogs[0].created_at), { addSuffix: true })
      : '—'

    return {
      ordersThisWeek,
      lastOrder,
      activeUsers,
      lastActivity,
    }
  }, [auditLogs])

  const formatAction = (action: string) =>
    action
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 space-y-4">
        <div>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Who placed orders and nudged the system this week.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Orders this week</div>
            <div className="mt-1 text-xl font-semibold">{metrics.ordersThisWeek}</div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Active users</div>
            <div className="mt-1 text-xl font-semibold">{metrics.activeUsers}</div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Last activity</div>
            <div className="mt-1 text-xl font-semibold">{metrics.lastActivity}</div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Latest order</div>
            <div className="mt-1 text-sm font-semibold">
              {metrics.lastOrder
                ? `${formatDistanceToNow(new Date(metrics.lastOrder.created_at), { addSuffix: true })}`
                : '—'}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading activity...</div>
        ) : auditLogs.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No recent activity</div>
        ) : (
          <ul className="divide-y">
            {auditLogs.map((a: any) => (
              <li key={a.id} className="p-4 text-sm flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{formatAction(a.action)}</span>
                    {a.entity_type ? (
                      <Badge variant="outline" className="text-[11px]">
                        {a.entity_type}
                      </Badge>
                    ) : null}
                  </div>
                  {a.tenant?.name ? (
                    <p className="text-xs text-muted-foreground">{a.tenant.name}</p>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
export default ActivityList
