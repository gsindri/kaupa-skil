
import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'

export function TenantSwitcher() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()

  // Get all tenants the user has membership in
  const { data: userMemberships } = useQuery({
    queryKey: ['user-memberships', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select(`
          id,
          base_role,
          tenant:tenants(
            id,
            name
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  // Get current tenant name
  const currentTenant = userMemberships?.find(
    membership => membership.tenant && 
    typeof membership.tenant === 'object' && 
    'id' in membership.tenant && 
    membership.tenant.id === profile?.tenant_id
  )?.tenant

  const displayName = currentTenant && typeof currentTenant === 'object' && 'name' in currentTenant 
    ? String(currentTenant.name)
    : 'No Organization'

  const handleTenantSwitch = async (tenantId: string | null) => {
    if (!user?.id) return

    try {
      // Update the user's profile to switch to the new tenant
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('id', user.id)

      if (error) throw error

      // Refresh the page to update the context
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch tenant:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-2">
          <span className="font-medium">{displayName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => handleTenantSwitch(null)}
          className={!profile?.tenant_id ? 'bg-muted' : ''}
        >
          <span className="font-medium">No Organization</span>
        </DropdownMenuItem>

        {userMemberships?.map((membership) => {
          const tenant = membership.tenant
          const tenantId = tenant && typeof tenant === 'object' && 'id' in tenant ? tenant.id : null
          const tenantName = tenant && typeof tenant === 'object' && 'name' in tenant ? String(tenant.name) : 'Unknown'
          
          return (
            <DropdownMenuItem
              key={membership.id}
              onClick={() => tenantId && handleTenantSwitch(tenantId as string)}
              className={tenantId === profile?.tenant_id ? 'bg-muted' : ''}
            >
              <div className="flex flex-col">
                <span className="font-medium">{tenantName}</span>
                <span className="text-sm text-muted-foreground capitalize">
                  {membership.base_role}
                </span>
              </div>
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings/organization/create')}>
          <span className="text-sm text-muted-foreground">Create Organization</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings/organization/join')}>
          <span className="text-sm text-muted-foreground">Join Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
