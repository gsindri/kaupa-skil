
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Play, Upload, Plus, Building2 } from 'lucide-react'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Database } from '@/lib/types'

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
  onHarUpload?: (supplierId: string) => void
}

export function SupplierList({
  suppliers,
  credentials,
  selectedSupplier,
  onSelectSupplier,
  onRunConnector,
  onHarUpload
}: SupplierListProps) {
  const { createSupplier } = useSuppliers()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newConnectorType, setNewConnectorType] = useState('generic')

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSupplier.mutateAsync({
        name: newSupplierName,
        connector_type: newConnectorType,
        logo_url: '/placeholder.svg'
      })
      setIsDialogOpen(false)
      setNewSupplierName('')
      setNewConnectorType('generic')
    } catch (error) {
      // error handled in hook
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
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Available Suppliers</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Supplier</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <Label htmlFor="supplier-name">Name</Label>
                <Input
                  id="supplier-name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Supplier name"
                />
              </div>
              <div>
                <Label htmlFor="connector-type">Connector Type</Label>
                <Select
                  value={newConnectorType}
                  onValueChange={setNewConnectorType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">Generic</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="portal">Portal</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={!newSupplierName || createSupplier.isPending}
                >
                  {createSupplier.isPending ? 'Saving...' : 'Save Supplier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suppliers && suppliers.length > 0 ? (
            suppliers.map((supplier) => {
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
                      {onHarUpload && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onHarUpload(supplier.id)
                          }}
                          title="Sync via HAR upload"
                        >
                          <Upload className="h-3 w-3" />
                        </Button>
                      )}
                      {status === 'verified' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRunConnector(supplier.id)
                          }}
                          title="Run connector"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4" />
              <p>No suppliers found</p>
              <p className="text-sm">Add a supplier to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
