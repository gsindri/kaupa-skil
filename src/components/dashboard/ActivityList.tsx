import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/useAuth'
import { useAuditLogs } from '@/hooks/useAuditLogs'

export function ActivityList() {
  const { profile } = useAuth()
  const { auditLogs = [], isLoading } = useAuditLogs({ tenantId: profile?.tenant_id })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
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
                <span>{a.action}</span>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString('is-IS')}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
export default ActivityList
