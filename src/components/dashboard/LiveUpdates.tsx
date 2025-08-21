import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pause, Play, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLiveUpdates } from '@/hooks/useLiveUpdates'

export function LiveUpdates() {
  const [paused, setPaused] = React.useState(false)
  const { updates, isLoading } = useLiveUpdates()

  const getIcon = (type: string) => {
    switch (type) {
      default:
        return <RefreshCcw className="h-4 w-4" />
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Live Updates</CardTitle>
        <Button size="icon" variant="ghost" onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume' : 'Pause'}>
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading updates...</div>
        ) : updates.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No updates</div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="p-4 space-y-4">
              {updates.map((u) => (
                <li key={u.id} className="flex items-start gap-2 text-sm">
                  {getIcon(u.type)}
                  <div>
                    <div>{u.message}</div>
                    <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString('is-IS')}</div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
export default LiveUpdates
