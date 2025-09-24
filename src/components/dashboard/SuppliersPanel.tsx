import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCcw, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supplierStatusTokens } from './status-tokens'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'

const formatInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || '—'

const formatSyncLine = (status: string, lastSync: string | null, nextRun: string | null) => {
  if (status === 'needs_login') return 'Reconnect to resume syncing.'
  if (status === 'disconnected') return 'Connection lost — reconnect to pull updates.'
  if (status === 'not_connected') return 'Not connected yet.'

  const parts: string[] = []
  if (lastSync) parts.push(`Synced ${formatDistanceToNow(new Date(lastSync), { addSuffix: true })}`)
  if (nextRun) parts.push(`Next ${formatDistanceToNow(new Date(nextRun), { addSuffix: true })}`)

  return parts.length > 0 ? parts.join(' • ') : 'Ready for first sync'
}

export function SuppliersPanel() {
  const { suppliers, isLoading } = useSupplierConnections()

  const summary = useMemo(() => {
    const total = suppliers.length
    const connected = suppliers.filter((s) => s.status === 'connected').length
    const attention = suppliers.filter((s) => s.status === 'needs_login' || s.status === 'disconnected').length

    return { total, connected, attention }
  }, [suppliers])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">Suppliers</CardTitle>
          <p className="text-sm text-muted-foreground">
            {summary.total > 0
              ? `${summary.connected} connected • ${summary.attention} need attention`
              : 'Connect your suppliers to keep pricing up to date.'}
          </p>
        </div>
        <Button size="sm" variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add supplier
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Add your first supplier to start pulling catalogues, prices and delivery slots.
          </div>
        ) : (
          <ul className="divide-y">
            {suppliers.map((supplier) => (
              <li key={supplier.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border bg-white">
                    {supplier.logo_url ? (
                      <AvatarImage src={supplier.logo_url} alt={`${supplier.name} logo`} />
                    ) : (
                      <AvatarFallback>{formatInitials(supplier.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      <span>{supplier.name}</span>
                      <Badge className={`text-xs ${supplierStatusTokens[supplier.status].badge}`}>
                        {supplierStatusTokens[supplier.status].label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatSyncLine(supplier.status, supplier.last_sync, supplier.next_run)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start text-sm sm:self-auto">
                  {supplier.status === 'needs_login' || supplier.status === 'disconnected' ? (
                    <Button size="sm" variant="outline">
                      Reconnect
                    </Button>
                  ) : null}
                  <Button size="sm" variant="ghost" className="gap-1">
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
