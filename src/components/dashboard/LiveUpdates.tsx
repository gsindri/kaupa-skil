import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pause, Play, ShoppingCart, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UpdateItem {
  id: string
  icon: React.ReactNode
  message: string
  time: string
}

const mockUpdates: UpdateItem[] = [
  { id: '1', icon: <RefreshCcw className="h-4 w-4" />, message: 'Sync started for Véfkaupmenn', time: 'Just now' },
  { id: '2', icon: <ShoppingCart className="h-4 w-4" />, message: 'Order placed with Heilsuhúsið', time: '5m ago' }
]

export function LiveUpdates() {
  const [paused, setPaused] = React.useState(false)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Live Updates</CardTitle>
        <Button size="icon" variant="ghost" onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume' : 'Pause'}>
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {mockUpdates.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No updates</div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="p-4 space-y-4">
              {mockUpdates.map((u) => (
                <li key={u.id} className="flex items-start gap-2 text-sm">
                  {u.icon}
                  <div>
                    <div>{u.message}</div>
                    <div className="text-xs text-muted-foreground">{u.time}</div>
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
