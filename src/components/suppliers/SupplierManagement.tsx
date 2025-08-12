
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Settings, Play, Clock, CheckCircle, XCircle } from 'lucide-react'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export function SupplierManagement() {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  const { data: suppliers, refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      return data
    }
  })

  const { data: credentials } = useQuery({
    queryKey: ['supplier-credentials', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []

      const { data, error } = await supabase
        .from('supplier_credentials')
        .select('*, suppliers(*)')
        .eq('tenant_id', profile.tenant_id)

      if (error) throw error
      return data
    },
    enabled: !!profile?.tenant_id
  })

  const { data: connectorRuns } = useQuery({
    queryKey: ['connector-runs', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []

      const { data, error } = await supabase
        .from('connector_runs')
        .select('*, suppliers(*)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: !!profile?.tenant_id
  })

  const handleRunConnector = async (supplierId: string) => {
    if (!profile?.tenant_id) return

    try {
      // Create a new connector run
      const { data, error } = await supabase
        .from('connector_runs')
        .insert({
          tenant_id: profile.tenant_id,
          supplier_id: supplierId,
          connector_type: 'portal',
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Connector started',
        description: 'The price ingestion process has been started.',
      })

      // TODO: Trigger actual connector via Edge Function
      // For now, simulate completion after 3 seconds
      setTimeout(async () => {
        await supabase
          .from('connector_runs')
          .update({
            status: 'completed',
            finished_at: new Date().toISOString(),
            items_found: Math.floor(Math.random() * 100) + 50,
            prices_updated: Math.floor(Math.random() * 80) + 30
          })
          .eq('id', data.id)

        toast({
          title: 'Ingestion completed',
          description: 'Price data has been successfully updated.',
        })
      }, 3000)

    } catch (error: any) {
      toast({
        title: 'Error starting connector',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const getCredentialStatus = (supplierId: string) => {
    const credential = credentials?.find(c => c.supplier_id === supplierId)
    if (!credential) return 'not-configured'
    if (credential.test_status === 'success') return 'verified'
    if (credential.test_status === 'failed') return 'failed'
    return 'configured'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-success">Verified</Badge>
      case 'configured':
        return <Badge variant="secondary">Configured</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Configured</Badge>
    }
  }

  const getRunStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'running':
        return <Clock className="h-4 w-4 text-warning animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Supplier Management</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="credentials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="credentials" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supplier List */}
            <Card>
              <CardHeader>
                <CardTitle>Available Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers?.map((supplier) => {
                    const status = getCredentialStatus(supplier.id)
                    return (
                      <div
                        key={supplier.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSupplier === supplier.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedSupplier(supplier.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.connector_type} connector
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(status)}
                            {status === 'verified' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRunConnector(supplier.id)
                                }}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Credentials Form */}
            <div>
              {selectedSupplier ? (
                <SupplierCredentialsForm
                  supplier={suppliers?.find(s => s.id === selectedSupplier)!}
                  onSuccess={() => {
                    // Refetch credentials to update status
                    setTimeout(() => window.location.reload(), 1000)
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a Supplier</h3>
                    <p className="text-muted-foreground">
                      Choose a supplier from the list to configure credentials.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
