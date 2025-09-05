
import React, { useState, useEffect, useRef } from 'react'
import { SupplierList } from './SupplierList'
import { SupplierCredentialsForm } from './SupplierCredentialsForm'
import { IngestionRunsList } from './IngestionRunsList'
import { HarUploadModal } from './HarUploadModal'
import { HarSyncStatus } from './HarSyncStatus'
import { SupplierItemsWithHarInfo } from './SupplierItemsWithHarInfo'
import { BookmarkletSync } from './BookmarkletSync'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Key, Activity, FileText } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useConnectorRuns } from '@/hooks/useConnectorRuns'
import { useSupplierItems } from '@/hooks/useSupplierItems'
import { useAuth } from '@/contexts/useAuth'

export function EnhancedSupplierManagement() {
  const { profile } = useAuth()
  const { suppliers, isLoading: suppliersLoading } = useSuppliers()
  const { credentials } = useSupplierCredentials()
  const { createRun } = useConnectorRuns()
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null)
  const [harUploadOpen, setHarUploadOpen] = useState(false)
  const [processingSupplier, setProcessingSupplier] = useState<string | null>(null)
  const previousSupplierCount = useRef(0)

  const { items: selectedSupplierItems, stats: itemStats } = useSupplierItems(selectedSupplier || undefined)

  useEffect(() => {
    if (
      suppliers &&
      suppliers.length > 0 &&
      previousSupplierCount.current === 0 &&
      !selectedSupplier
    ) {
      setSelectedSupplier(suppliers[0].id)
    }
    previousSupplierCount.current = suppliers?.length ?? 0
  }, [suppliers, selectedSupplier])

  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSupplier(supplierId)
  }

  const handleRunConnector = async (supplierId: string) => {
    const supplier = suppliers?.find(s => s.id === supplierId)
    if (!supplier) return

    setProcessingSupplier(supplierId)
    try {
      await createRun.mutateAsync({
        tenant_id: profile?.tenant_id ?? null,
        supplier_id: supplierId,
        connector_type: supplier.connector_type || 'generic',
        status: 'pending'
      })
    } finally {
      setProcessingSupplier(null)
    }
  }

  const handleHarUpload = (supplierId: string) => {
    setSelectedSupplier(supplierId)
    setHarUploadOpen(true)
  }

  const handleHarUploadSuccess = () => {
    // Refresh supplier items data
    if (selectedSupplier) {
      // The useSupplierItems hook will automatically refetch
    }
  }

  const selectedSupplierData = suppliers?.find(s => s.id === selectedSupplier)

  // Helper function to extract domain from website URL
  const getDomainHint = (website: string | null) => {
    if (!website) return undefined
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`)
      return `${url.protocol}//${url.hostname}/*`
    } catch {
      return website.includes('.') ? `https://${website}/*` : undefined
    }
  }

  return (
    <>
      <Tabs defaultValue="suppliers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="items" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-6">
          <SupplierList 
            suppliers={suppliers || []}
            credentials={credentials || []}
            selectedSupplier={selectedSupplier}
            onSelectSupplier={handleSelectSupplier}
            onRunConnector={handleRunConnector}
            onHarUpload={handleHarUpload}
          />
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <SupplierCredentialsForm />
        </TabsContent>

        <TabsContent value="ingestion" className="space-y-6">
          <IngestionRunsList />
        </TabsContent>

        <TabsContent value="items" className="space-y-6">
          {!suppliers || suppliers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found. Add a supplier to view items and sync status
            </div>
          ) : selectedSupplier && selectedSupplierData ? (
            <div className="space-y-6">
              <HarSyncStatus
                supplierId={selectedSupplier}
                supplierName={selectedSupplierData.name}
                lastSyncAt={selectedSupplierItems[0]?.last_seen_at || null}
                itemCount={itemStats.total}
                onHarUpload={() => handleHarUpload(selectedSupplier)}
                isProcessing={processingSupplier === selectedSupplier}
              />

              {/* Add Bookmarklet Sync option */}
              <BookmarkletSync
                tenantId={profile?.tenant_id || ''}
                supplierId={selectedSupplier}
                supplierDomainHint={getDomainHint(selectedSupplierData.website)}
              />

              <SupplierItemsWithHarInfo
                items={selectedSupplierItems}
                supplierId={selectedSupplier}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Select a supplier to view their items and sync status
            </div>
          )}
        </TabsContent>
      </Tabs>

      <HarUploadModal
        open={harUploadOpen}
        onClose={() => setHarUploadOpen(false)}
        tenantId={profile?.tenant_id || ''}
        supplierId={selectedSupplier || ''}
        onSuccess={handleHarUploadSuccess}
      />
    </>
  )
}
