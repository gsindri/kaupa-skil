import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supplierStatusTokens } from './status-tokens'
import { useSupplierConnections } from '@/hooks/useSupplierConnections'

export function SuppliersPanel() {
  const { suppliers, isLoading } = useSupplierConnections()

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">My Suppliers</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground text-center">Loading suppliers...</div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No suppliers connected</div>
        ) : (
          <ul className="divide-y">
            {suppliers.map((s) => (
              <li key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {s.name}
                    <Badge className={`${supplierStatusTokens[s.status].badge}`}>{supplierStatusTokens[s.status].label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Last sync {s.last_sync ? new Date(s.last_sync).toLocaleString('is-IS') : '—'} • Next run {s.next_run ? new Date(s.next_run).toLocaleString('is-IS') : 'Pending'}</div>
                </div>
                <div className="flex gap-2">
                  {s.status === 'needs_login' && (
                    <Button size="sm" variant="secondary">Reconnect</Button>
                  )}
                  <Button size="sm">Run now</Button>
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
