
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { Database } from '@/lib/types/database'

type ConnectorRun = Database['public']['Tables']['connector_runs']['Row'] & {
  suppliers?: Database['public']['Tables']['suppliers']['Row']
}

interface IngestionRunsListProps {
  connectorRuns: ConnectorRun[]
}

export function IngestionRunsList({ connectorRuns }: IngestionRunsListProps) {
  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Ingestion Runs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {connectorRuns?.map((run) => (
            <div key={run.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getRunStatusIcon(run.status)}
                <div>
                  <div className="font-medium">{run.suppliers?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(run.started_at).toLocaleString('is-IS')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {run.status === 'completed' && (
                  <div className="text-sm text-muted-foreground">
                    {run.items_found} items • {run.prices_updated} prices updated
                  </div>
                )}
                <Badge variant={
                  run.status === 'completed' ? 'default' :
                  run.status === 'failed' ? 'destructive' :
                  run.status === 'running' ? 'secondary' : 'outline'
                }>
                  {run.status}
                </Badge>
              </div>
            </div>
          ))}
          
          {(!connectorRuns || connectorRuns.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No ingestion runs yet. Configure supplier credentials and run your first ingestion.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
