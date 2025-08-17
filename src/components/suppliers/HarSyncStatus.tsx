
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Clock, RefreshCw, Upload } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface HarSyncStatusProps {
  supplierId: string
  supplierName: string
  lastSyncAt?: string | null
  itemCount: number
  onHarUpload: () => void
  onRetrySync?: () => void
  isProcessing?: boolean
}

export function HarSyncStatus({
  supplierId,
  supplierName,
  lastSyncAt,
  itemCount,
  onHarUpload,
  onRetrySync,
  isProcessing = false
}: HarSyncStatusProps) {
  const getSyncStatus = () => {
    if (!lastSyncAt) {
      return {
        status: 'never',
        color: 'destructive',
        icon: AlertCircle,
        text: 'Never synced'
      }
    }

    const daysSinceSync = Math.floor(
      (Date.now() - new Date(lastSyncAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceSync <= 1) {
      return {
        status: 'fresh',
        color: 'default',
        icon: CheckCircle,
        text: `Synced ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`
      }
    } else if (daysSinceSync <= 7) {
      return {
        status: 'recent',
        color: 'secondary',
        icon: Clock,
        text: `Synced ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`
      }
    } else {
      return {
        status: 'stale',
        color: 'outline',
        icon: AlertCircle,
        text: `Last synced ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`
      }
    }
  }

  const syncInfo = getSyncStatus()
  const StatusIcon = syncInfo.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            HAR Sync Status
          </span>
          <Badge variant={syncInfo.color as any} className={
            syncInfo.status === 'fresh' ? 'bg-green-500' : ''
          }>
            {syncInfo.status === 'never' ? 'Not Synced' : 
             syncInfo.status === 'fresh' ? 'Up to Date' :
             syncInfo.status === 'recent' ? 'Recent' : 'Needs Update'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Data synchronization status for {supplierName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Items:</span>
            <span className="ml-2 font-medium">{itemCount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <span className="ml-2 font-medium">{syncInfo.text}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onHarUpload}
            disabled={isProcessing}
            className="flex-1"
          >
            <Upload className="h-3 w-3 mr-2" />
            {isProcessing ? 'Processing...' : 'Upload HAR File'}
          </Button>
          
          {onRetrySync && syncInfo.status !== 'never' && (
            <Button
              variant="outline"
              onClick={onRetrySync}
              disabled={isProcessing}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>

        {syncInfo.status === 'stale' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <div className="font-medium">Data may be outdated</div>
              <div className="text-xs mt-1">
                Consider uploading a fresh HAR file to get the latest pricing and product information.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
