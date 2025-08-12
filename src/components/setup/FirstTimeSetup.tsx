
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, Users } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export function FirstTimeSetup() {
  const { user, refetch } = useAuth()
  const { toast } = useToast()
  const [tenantName, setTenantName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateTenant = async () => {
    if (!tenantName.trim() || !user) return

    setIsCreating(true)
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          name: tenantName.trim(),
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Organization created successfully!',
        description: `Welcome to ${data.name}. You are now the owner.`
      })

      // Refresh user profile to get the new tenant_id
      await refetch()
    } catch (error: any) {
      toast({
        title: 'Failed to create organization',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <p className="text-muted-foreground">
            Let's set up your organization to get started
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="tenantName">Organization Name</Label>
            <Input
              id="tenantName"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              placeholder="e.g., Acme Corp"
              disabled={isCreating}
            />
          </div>
          
          <Button 
            onClick={handleCreateTenant}
            disabled={!tenantName.trim() || isCreating}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Organization'}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            You will be set up as the owner with full administrative privileges.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
