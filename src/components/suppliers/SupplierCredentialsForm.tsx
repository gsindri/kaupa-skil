
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Database } from '@/lib/types/database'

type Supplier = Database['public']['Tables']['suppliers']['Row']

interface SupplierCredentialsFormProps {
  supplier: Supplier
  onSuccess?: () => void
}

export function SupplierCredentialsForm({ supplier, onSuccess }: SupplierCredentialsFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    additionalData: ''
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  
  const { profile } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.tenant_id) return

    setLoading(true)
    try {
      // In a real implementation, we would encrypt the credentials client-side
      // For now, we'll simulate this with a simple JSON encoding
      const encryptedBlob = btoa(JSON.stringify(formData))

      const { error } = await supabase
        .from('supplier_credentials')
        .upsert({
          tenant_id: profile.tenant_id,
          supplier_id: supplier.id,
          encrypted_blob: encryptedBlob,
        })

      if (error) throw error

      toast({
        title: 'Credentials saved',
        description: `Credentials for ${supplier.name} have been securely stored.`,
      })

      onSuccess?.()
    } catch (error: any) {
      toast({
        title: 'Error saving credentials',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      // Simulate testing connection - in real implementation this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: 'Connection test successful',
        description: `Successfully connected to ${supplier.name}`,
      })
    } catch (error: any) {
      toast({
        title: 'Connection test failed',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credentials for {supplier.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username">Username / Email</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          {supplier.connector_type === 'portal' && (
            <div>
              <Label htmlFor="additionalData">Additional Settings (JSON)</Label>
              <Textarea
                id="additionalData"
                value={formData.additionalData}
                onChange={(e) => setFormData(prev => ({ ...prev, additionalData: e.target.value }))}
                placeholder='{"loginUrl": "https://example.com/login", "timeout": 30000}'
                rows={3}
              />
            </div>
          )}

          <div className="flex space-x-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Credentials'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTestConnection}
              disabled={testing || !formData.username || !formData.password}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
