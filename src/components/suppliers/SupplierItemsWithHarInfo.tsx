
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, AlertCircle } from 'lucide-react'
import type { Database } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

type SupplierItem = Database['public']['Tables']['supplier_items']['Row']

interface SupplierItemsWithHarInfoProps {
  items: SupplierItem[]
  supplierId: string
}

export function SupplierItemsWithHarInfo({ items, supplierId }: SupplierItemsWithHarInfoProps) {
  const getDataSourceBadge = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return null
    
    const daysSinceLastSeen = Math.floor(
      (Date.now() - new Date(lastSeenAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysSinceLastSeen <= 1) {
      return <Badge variant="default" className="bg-green-500">Fresh Data</Badge>
    } else if (daysSinceLastSeen <= 7) {
      return <Badge variant="secondary">Recent Data</Badge>
    } else if (daysSinceLastSeen <= 30) {
      return <Badge variant="outline">Aging Data</Badge>
    } else {
      return <Badge variant="destructive">Stale Data</Badge>
    }
  }

  const getLastSeenText = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never synced'
    return `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Supplier Items
          </CardTitle>
          <CardDescription>
            No items found. Upload a HAR file to sync product data.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Supplier Items ({items.length})
        </CardTitle>
        <CardDescription>
          Product data synchronized from supplier systems
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{item.display_name}</div>
                <div className="text-sm text-muted-foreground">
                  SKU: {item.ext_sku}
                  {item.brand && ` • Brand: ${item.brand}`}
                  {item.pack_qty && item.pack_unit_id && (
                    ` • Pack: ${item.pack_qty} ${item.pack_unit_id}`
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {getLastSeenText(item.last_seen_at)}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getDataSourceBadge(item.last_seen_at)}
                <Badge variant="outline" className="text-xs">
                  VAT: {item.vat_code || 0}%
                </Badge>
              </div>
            </div>
          ))}
          
          {items.length > 10 && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              ... and {items.length - 10} more items
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
