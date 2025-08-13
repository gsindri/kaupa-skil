import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, Users, Building2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

export function FirstTimeSetup() {
  const { user, refetch } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [tenantName, setTenantName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateTenant = async () => {
    if (!tenantName.trim() || !user) return

    setIsCreating(true)
    try {
      console.log('Creating tenant for user:', user.id)
      
      // Create the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: tenantName.trim(),
          created_by: user.id
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      console.log('Tenant created:', tenant)

      // Update the user's profile with the new tenant_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenant.id })
        .eq('id', user.id)

      if (profileError) throw profileError

      console.log('Profile updated with tenant_id:', tenant.id)

      toast({
        title: 'Organization created successfully!',
        description: `Welcome to ${tenant.name}. You are now the owner.`
      })

      // Refresh user profile to get the new tenant_id
      await refetch()
      
      // Navigate to the main app
      navigate('/', { replace: true })
    } catch (error: any) {
      console.error('Error creating tenant:', error)
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
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background with soft radial accents */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 20% -10%, rgba(37,99,235,0.15), transparent 60%), radial-gradient(1200px 800px at 120% 110%, rgba(16,185,129,0.12), transparent 60%), linear-gradient(180deg, #eef2ff, #f8fafc)",
        }}
      />
      
      <main className="relative flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/50 bg-white/60 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-2xl bg-blue-50 px-3 py-2 mb-6">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-gray-900">Iceland B2B Wholesale</p>
                <p className="text-xs text-gray-600">Setup your organization</p>
              </div>
            </div>
            
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Welcome!</h1>
            <p className="text-gray-600 mt-2">
              Let's set up your organization to get started
            </p>
          </div>
          
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="tenantName" className="block text-sm font-medium text-gray-900">
                Organization Name
              </Label>
              <Input
                id="tenantName"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="e.g., Acme Corp"
                disabled={isCreating}
                className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 shadow-xs outline-none ring-0 transition focus:border-gray-300 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            
            <Button 
              onClick={handleCreateTenant}
              disabled={!tenantName.trim() || isCreating}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-black focus:outline-none focus-visible:ring-4 focus-visible:ring-black/20 disabled:opacity-50"
            >
              <Users className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Organization'}
            </Button>

            <div className="text-sm text-gray-600 text-center">
              You will be set up as the owner with full administrative privileges.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
