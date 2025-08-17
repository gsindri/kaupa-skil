
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, Upload, Zap, AlertCircle } from 'lucide-react'
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
    if (!lastSyncAt) {
      return {
        status: 'never',
        color: 'destructive' as const,
        text: 'Never synced',
        description: 'No data has been imported from this supplier yet'
      }
    }

    const syncDate = new Date(lastSyncAt)
    const now = new Date()
    const daysSince = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince === 0) {
      return {
        status: 'fresh',
        color: 'default' as const,
        text: 'Recently synced',
        description: `Synced ${formatDistanceToNow(syncDate)} ago`
      }
    } else if (daysSince <= 7) {
      return {
        status: 'recent',
        color: 'secondary' as const,
        text: 'Recently synced',
        description: `Synced ${formatDistanceToNow(syncDate)} ago`
      }
    } else if (daysSince <= 30) {
      return {
        status: 'aging',
        color: 'outline' as const,
        text: 'Data aging',
        description: `Last synced ${formatDistanceToNow(syncDate)} ago`
      }
    } else {
      return {
        status: 'stale',
        color: 'destructive' as const,
        text: 'Data stale',
        description: `Last synced ${formatDistanceToNow(syncDate)} ago`
      }
    }
  }

  const syncStatus = getSyncStatus()

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{supplierName} Data Sync</CardTitle>
            </div>
            <Badge variant={syncStatus.color} className="text-xs">
              {syncStatus.text}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onHarUpload}
              disabled={isProcessing}
              className="text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload HAR
            </Button>
          </div>
        </div>
        <CardDescription className="text-sm">
          {syncStatus.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">{itemCount.toLocaleString()} items</div>
              <div className="text-xs text-muted-foreground">In catalog</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {lastSyncAt ? formatDistanceToNow(new Date(lastSyncAt)) : 'Never'}
              </div>
              <div className="text-xs text-muted-foreground">Last sync</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
              <Zap className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {isProcessing ? 'Processing...' : 'Ready'}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
          </div>
        </div>

        {syncStatus.status === 'never' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-800">No data imported yet</div>
                <div className="text-yellow-700 mt-1">
                  Use the HAR upload or bookmarklet sync below to import supplier data for price comparisons and ordering.
                </div>
              </div>
            </div>
          </div>
        )}

        {syncStatus.status === 'stale' && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-orange-800">Data needs refresh</div>
                <div className="text-orange-700 mt-1">
                  Consider syncing again to get the latest prices and product availability.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
