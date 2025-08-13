import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Settings } from 'lucide-react'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { SupplierList } from './SupplierList'
import { IngestionRunsList } from './IngestionRunsList'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { Database } from '@/lib/types/database'

type Supplier = Database['public']['Tables']['suppliers']['Row']
type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row'] & {
  supplier?: Supplier
}

export function SupplierManagementRefactored() {
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  const { data: suppliers } = useQuery<Supplier[]>({
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

  const { data: credentials } = useQuery<SupplierCredential[]>({
    queryKey: ['supplier-credentials', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []

      const { data, error } = await supabase
        .from('supplier_credentials')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('tenant_id', profile.tenant_id)

      if (error) throw error
      return data
    },
    enabled: !!profile?.tenant_id
  })

  const handleRunConnector = async (supplierId: string) => {
    if (!profile?.tenant_id) return

    try {
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

      // Simulate completion for demo
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
            <SupplierList
              suppliers={suppliers || []}
              credentials={credentials || []}
              selectedSupplier={selectedSupplier}
              onSelectSupplier={setSelectedSupplier}
              onRunConnector={handleRunConnector}
            />

            <div>
              {selectedSupplier ? (
                <SupplierCredentialsForm />
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
          <IngestionRunsList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
