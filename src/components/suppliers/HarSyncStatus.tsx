
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, Clock, Package, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface HarSyncStatusProps {
  supplierId: string
  supplierName: string
  lastSyncAt: string | null
  itemCount: number
  onHarUpload: () => void
  isProcessing?: boolean
}

export function HarSyncStatus({
  supplierId,
  supplierName,
  lastSyncAt,
  itemCount,
  onHarUpload,
  isProcessing = false
}: HarSyncStatusProps) {
  const getSyncStatus = () => {
    if (!lastSyncAt) return { status: 'never', color: 'gray', text: 'Never synced' }
    
    const lastSync = new Date(lastSyncAt)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSince === 0) return { status: 'fresh', color: 'green', text: 'Today' }
    if (daysSince <= 7) return { status: 'recent', color: 'blue', text: `${daysSince} days ago` }
    if (daysSince <= 30) return { status: 'aging', color: 'yellow', text: `${daysSince} days ago` }
    return { status: 'stale', color: 'red', text: `${daysSince} days ago` }
  }

  const syncStatus = getSyncStatus()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{supplierName}</CardTitle>
            <CardDescription>Product data synchronization status</CardDescription>
          </div>
          <Button
            onClick={onHarUpload}
            disabled={isProcessing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Sync via HAR'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Last Sync</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={syncStatus.color === 'green' ? 'default' : 
                          syncStatus.color === 'blue' ? 'secondary' : 
                          syncStatus.color === 'yellow' ? 'outline' : 'destructive'}
                  className="text-xs"
                >
                  {syncStatus.text}
                </Badge>
                {lastSyncAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Items</p>
              <p className="text-lg font-semibold">{itemCount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className={`text-sm font-medium ${
                syncStatus.status === 'fresh' ? 'text-green-600' :
                syncStatus.status === 'recent' ? 'text-blue-600' :
                syncStatus.status === 'aging' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {syncStatus.status === 'fresh' ? 'Up to date' :
                 syncStatus.status === 'recent' ? 'Recent' :
                 syncStatus.status === 'aging' ? 'Needs update' :
                 syncStatus.status === 'never' ? 'Not synced' : 'Outdated'}
              </p>
            </div>
          </div>
        </div>

        {syncStatus.status === 'stale' && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span>This supplier's data is outdated. Consider syncing again for the latest prices and availability.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
