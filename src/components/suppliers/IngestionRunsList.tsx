import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useAuth } from '@/contexts/useAuth'

export function IngestionRunsList() {
  const { profile } = useAuth()
  const { runs, createRun } = useConnectorRuns()
  const { credentials } = useSupplierCredentials()

  const handleStartIngestion = async (supplierId: string, connectorType: string) => {
    await createRun.mutateAsync({
      tenant_id: profile?.tenant_id ?? null,
      supplier_id: supplierId,
      connector_type: connectorType,
      status: 'pending'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'running':
        return <Badge variant="secondary">Running</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getProgress = (run: any) => {
    if (run.status === 'completed') return 100
    if (run.status === 'running') return 50
    if (run.status === 'pending') return 10
    return 0
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Quick Actions</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {credentials?.filter(c => c.test_status === 'success').map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <div className="font-medium">{credential.supplier?.name}</div>
                  <div className="text-sm text-muted-foreground">
                    Type: {credential.supplier?.connector_type || 'Generic'}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartIngestion(
                    credential.supplier_id, 
                    credential.supplier?.connector_type || 'generic'
                  )}
                  disabled={createRun.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Ingestion
                </Button>
              </div>
            ))}

            {(!credentials || credentials.filter(c => c.test_status === 'success').length === 0) && (
              <div className="text-center py-6 text-muted-foreground">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p>No active supplier connections</p>
                <p className="text-sm">Set up supplier credentials first</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Ingestion Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {runs?.slice(0, 10).map((run) => (
              <div key={run.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="font-medium">
                        {run.supplier?.name || 'Unknown Supplier'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {run.connector_type} connector • Started {new Date(run.started_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(run.status)}
                </div>

                <Progress value={getProgress(run)} className="mb-3" />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Items Found</div>
                    <div className="font-medium">{run.items_found || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Prices Updated</div>
                    <div className="font-medium">{run.prices_updated || 0}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Errors</div>
                    <div className="font-medium text-red-600">{run.errors_count || 0}</div>
                  </div>
                </div>

                {run.finished_at && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Completed: {new Date(run.finished_at).toLocaleString()}
                  </div>
                )}
              </div>
            ))}

            {(!runs || runs.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4" />
                <p>No ingestion runs yet</p>
                <p className="text-sm">Start your first price ingestion to see results here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
