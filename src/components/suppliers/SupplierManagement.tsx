
import React from 'react'
import { SupplierList } from './SupplierList'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { IngestionRunsList } from './IngestionRunsList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Key, Activity } from 'lucide-react'

export function SupplierManagement() {
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
        <SupplierList />
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
