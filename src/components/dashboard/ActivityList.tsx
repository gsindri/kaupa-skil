import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityItem {
  id: string
  message: string
  time: string
}

const mockActivity: ActivityItem[] = [
  { id: '1', message: 'Order #1234 placed', time: '1h ago' },
  { id: '2', message: 'Invitation sent to user@example.com', time: '3h ago' }
]

export function ActivityList() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {mockActivity.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No recent activity</div>
        ) : (
          <ul className="divide-y">
            {mockActivity.map((a) => (
              <li key={a.id} className="p-4 text-sm flex items-center justify-between">
                <span>{a.message}</span>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
export default ActivityList
