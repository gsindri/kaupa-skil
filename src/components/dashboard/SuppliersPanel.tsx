import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supplierStatusTokens, SupplierStatus } from './status-tokens'

interface Supplier {
  id: string
  name: string
  status: SupplierStatus
  lastSync: string
  nextRun: string
}

const mockSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Véfkaupmenn', status: 'connected', lastSync: '2h ago', nextRun: '09:00' },
  { id: 'sup-2', name: 'Heilsuhúsið', status: 'connected', lastSync: '4h ago', nextRun: '09:00' },
  { id: 'sup-3', name: 'Nordic Fresh', status: 'needs_login', lastSync: '2d ago', nextRun: 'Pending' }
]

export function SuppliersPanel() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">My Suppliers</CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {mockSuppliers.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">No suppliers connected</div>
        ) : (
          <ul className="divide-y">
            {mockSuppliers.map((s) => (
              <li key={s.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {s.name}
                    <Badge className={`${supplierStatusTokens[s.status].badge}`}>{supplierStatusTokens[s.status].label}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Last sync {s.lastSync} • Next run {s.nextRun}</div>
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
