
import React, { useState } from 'react'
import { SupplierList } from './SupplierList'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { IngestionRunsList } from './IngestionRunsList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Key, Activity } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useAuth } from '@/contexts/AuthProvider'

export function SupplierManagement() {
  const { profile } = useAuth()
  const { suppliers } = useSuppliers()
  const { credentials } = useSupplierCredentials()
  const { createRun } = useConnectorRuns()
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplier(supplierId)
  }

  const handleRunConnector = async (supplierId: string) => {
    if (!profile?.tenant_id) return

    const supplier = suppliers?.find(s => s.id === supplierId)
    if (!supplier) return

    await createRun.mutateAsync({
      tenant_id: profile.tenant_id,
      supplier_id: supplierId,
      connector_type: supplier.connector_type || 'generic',
      status: 'pending'
    })
  }

  return (
    <Tabs defaultValue="suppliers" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="suppliers" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Suppliers
        </TabsTrigger>
        <TabsTrigger value="credentials" className="flex items-center gap-2">
          <Key className="h-4 w-4" />
          Credentials
        </TabsTrigger>
        <TabsTrigger value="ingestion" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Ingestion
        </TabsTrigger>
      </TabsList>

      <TabsContent value="suppliers" className="space-y-6">
        <SupplierList 
          suppliers={suppliers || []}
          credentials={credentials || []}
          selectedSupplier={selectedSupplier}
          onSelectSupplier={handleSelectSupplier}
          onRunConnector={handleRunConnector}
        />
      </TabsContent>

      <TabsContent value="credentials" className="space-y-6">
        <SupplierCredentialsForm />
      </TabsContent>

      <TabsContent value="ingestion" className="space-y-6">
        <IngestionRunsList />
      </TabsContent>
    </Tabs>
  )
}
