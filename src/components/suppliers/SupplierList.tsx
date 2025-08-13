
import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play } from 'lucide-react'
import { Database } from '@/lib/types/database'

type Supplier = Database['public']['Tables']['suppliers']['Row']
type SupplierCredential = Database['public']['Tables']['supplier_credentials']['Row'] & {
  supplier?: Supplier
}

interface SupplierListProps {
  suppliers: Supplier[]
  credentials: SupplierCredential[]
  selectedSupplier: string | null
  onSelectSupplier: (supplierId: string) => void
  onRunConnector: (supplierId: string) => void
}

export function SupplierList({ 
  suppliers, 
  credentials, 
  selectedSupplier, 
  onSelectSupplier, 
  onRunConnector 
}: SupplierListProps) {
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
        return <Badge variant="default" className="bg-green-500">Verified</Badge>
      case 'configured':
        return <Badge variant="secondary">Configured</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Not Configured</Badge>
    }
  }

  return (
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
                onClick={() => onSelectSupplier(supplier.id)}
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
                          onRunConnector(supplier.id)
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
  )
}
