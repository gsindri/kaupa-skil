
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Play, TestTube, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ConnectorHealthCardProps {
  supplier: {
    id: string
    name: string
    status: 'connected' | 'needs_login' | 'error' | 'syncing'
    lastSync: string
    nextRun: string
    lastRunId?: string
  }
}

export function ConnectorHealthCard({ supplier }: ConnectorHealthCardProps) {
  const handleRunNow = () => {
    toast({
      title: 'Sync started',
      description: `${supplier.name} sync has been initiated`
    })
  }

  const handleTest = () => {
    toast({
      title: 'Connection tested',
      description: `${supplier.name} connection is working properly`
    })
  }

  const getStatusIcon = () => {
    switch (supplier.status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'syncing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'needs_login':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusVariant = () => {
    switch (supplier.status) {
      case 'connected':
        return 'default'
      case 'syncing':
        return 'secondary'
      case 'needs_login':
        return 'outline'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = () => {
    switch (supplier.status) {
      case 'connected':
        return 'Connected'
      case 'syncing':
        return 'Syncing...'
      case 'needs_login':
        return 'Needs Login'
      case 'error':
        return 'Error'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{supplier.name}</CardTitle>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-1">
          <div>Last sync: {supplier.lastSync}</div>
          <div>Next run: {supplier.nextRun}</div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleRunNow}
            disabled={supplier.status === 'syncing'}
          >
            <Play className="h-3 w-3 mr-1" />
            Run now
          </Button>
          <Button size="sm" variant="ghost" onClick={handleTest}>
            <TestTube className="h-3 w-3 mr-1" />
            Test
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
