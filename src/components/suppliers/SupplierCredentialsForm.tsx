import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Key, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useSupplierCredentials } from '@/hooks/useSupplierCredentials'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useAuth } from '@/contexts/useAuth'

export function SupplierCredentialsForm() {
  const { profile } = useAuth()
  const { suppliers } = useSuppliers()
  const { credentials, createCredential, updateCredential, deleteCredential } = useSupplierCredentials()
  
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplierId || !profile?.tenant_id) return

    // In a real implementation, this would be encrypted client-side
    const encryptedBlob = JSON.stringify({
      username,
      password,
      apiKey
    })

    await createCredential.mutateAsync({
      tenant_id: profile.tenant_id,
      supplier_id: selectedSupplierId,
      encrypted_blob: encryptedBlob,
      test_status: 'pending'
    })

    // Reset form
    setSelectedSupplierId('')
    setUsername('')
    setPassword('')
    setApiKey('')
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Testing</Badge>
      default:
        return <Badge variant="outline">Not Tested</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>Add Supplier Credentials</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="API username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="API password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="apiKey">API Key (if required)</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional API key"
              />
            </div>

            <Button 
              type="submit" 
              disabled={!selectedSupplierId || createCredential.isPending}
              className="w-full"
            >
              {createCredential.isPending ? 'Saving...' : 'Save Credentials'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stored Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {credentials?.map((credential) => (
              <div
                key={credential.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(credential.test_status)}
                  <div>
                    <div className="font-medium">
                      {credential.supplier?.name || 'Unknown Supplier'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last tested: {credential.last_tested_at ? 
                        new Date(credential.last_tested_at).toLocaleString() : 
                        'Never'
                      }
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {getStatusBadge(credential.test_status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteCredential.mutate(credential.id)}
                    disabled={deleteCredential.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!credentials || credentials.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4" />
                <p>No credentials stored yet</p>
                <p className="text-sm">Add supplier credentials to enable price ingestion</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
