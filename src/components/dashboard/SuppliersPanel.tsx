import React from 'react'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RefreshCcw, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supplierStatusTokens } from './status-tokens'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'

export function SuppliersPanel() {
  const { suppliers, isLoading } = useSupplierConnections()

  const stats = useMemo(() => {
    const total = suppliers.length
    const connected = suppliers.filter((s) => s.status === 'connected').length
    const attention = suppliers.filter((s) => s.status === 'needs_login' || s.status === 'disconnected').length
    const mostRecentSync = suppliers
      .map((s) => (s.last_sync ? new Date(s.last_sync).getTime() : 0))
      .filter(Boolean)
      .sort((a, b) => b - a)[0]

    return {
      total,
      connected,
      attention,
      lastSyncText: mostRecentSync
        ? formatDistanceToNow(mostRecentSync, { addSuffix: true })
        : 'No syncs yet',
    }
  }, [suppliers])

  const renderSyncStatus = (lastSync: string | null, nextRun: string | null) => {
    const last = lastSync
      ? formatDistanceToNow(new Date(lastSync), { addSuffix: true })
      : 'Never'
    const next = nextRun
      ? formatDistanceToNow(new Date(nextRun), { addSuffix: true })
      : 'Pending'

    return `Synced ${last} • Next ${next}`
  }

  const renderAvatarFallback = (name: string) => {
    const initials = name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')

    return initials || '—'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Supply health</CardTitle>
            <p className="text-sm text-muted-foreground">
              Keep your integrations syncing so the pantry stays current.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="h-4 w-4" />
            Add supplier
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Connected</div>
            <div className="mt-1 text-xl font-semibold text-emerald-600">
              {stats.connected}
              <span className="text-sm font-medium text-muted-foreground"> / {stats.total}</span>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Needs attention</div>
            <div className={`mt-1 text-xl font-semibold ${stats.attention ? 'text-amber-600' : 'text-emerald-600'}`}>
              {stats.attention}
            </div>
            <p className="text-xs text-muted-foreground">Reconnect before the next order run</p>
          </div>
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="text-xs font-medium uppercase text-muted-foreground">Last sync</div>
            <div className="mt-1 text-xl font-semibold">{stats.lastSyncText}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground text-center space-y-3">
            <p className="font-medium text-foreground">No suppliers connected</p>
            <p>Add your first supplier to start pulling prices and catalogue updates.</p>
            <div>
              <Button size="sm">Browse suppliers</Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {suppliers.map((s) => (
              <li key={s.id} className="px-4 py-3 sm:py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border bg-white">
                    {s.logo_url ? (
                      <AvatarImage src={s.logo_url} alt={`${s.name} logo`} />
                    ) : (
                      <AvatarFallback>{renderAvatarFallback(s.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 font-medium">
                      <span>{s.name}</span>
                      <Badge className={`flex items-center gap-1 ${supplierStatusTokens[s.status].badge}`}>
                        <span className={`h-2 w-2 rounded-full ${supplierStatusTokens[s.status].dot}`} />
                        {supplierStatusTokens[s.status].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {renderSyncStatus(s.last_sync, s.next_run)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'needs_login' && (
                    <Button size="xs" variant="outline">
                      Reconnect
                    </Button>
                  )}
                  <Button size="xs" variant="ghost" className="gap-1">
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Run sync
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
export default SuppliersPanel
