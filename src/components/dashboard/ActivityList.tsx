import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/useAuth'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { formatDistanceToNow, subDays } from 'date-fns'

export function ActivityList() {
  const { profile } = useAuth()
  const { auditLogs = [], isLoading } = useAuditLogs({ tenantId: profile?.tenant_id })

  const { stats, recentLogs } = useMemo(() => {
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

    const activeUsers = new Set(
      auditLogs
        .map((log: any) => log.actor_id)
        .filter(Boolean)
    ).size

    const lastActivity = auditLogs[0]?.created_at
      ? formatDistanceToNow(new Date(auditLogs[0].created_at), { addSuffix: true })
      : '—'

    return {
      stats: { ordersThisWeek, activeUsers, lastActivity },
      recentLogs: auditLogs.slice(0, 6),
    }
  }, [auditLogs])

  const formatAction = (action: string) =>
    action
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-6 pb-4">
        <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        <p className="text-sm text-muted-foreground">
          {stats.ordersThisWeek > 0
            ? `${stats.ordersThisWeek} order${stats.ordersThisWeek === 1 ? '' : 's'} in the past week • Last update ${stats.lastActivity}.`
            : `Last update ${stats.lastActivity}. We’ll list new orders here as they happen.`}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Activity will appear here once your team starts ordering.
          </div>
        ) : (
          <ul className="divide-y">
            {recentLogs.map((log: any) => (
              <li key={log.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{formatAction(log.action)}</span>
                    {log.entity_type ? (
                      <Badge variant="outline" className="text-[11px] uppercase tracking-wide">
                        {log.entity_type}
                      </Badge>
                    ) : null}
                  </div>
                  {log.tenant?.name ? (
                    <p className="text-xs text-muted-foreground">{log.tenant.name}</p>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
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
