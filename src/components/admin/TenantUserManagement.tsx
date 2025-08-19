
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Users, Crown, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { UserPermissionsPanel } from './UserPermissionsPanel'
import { InviteUserDialog } from './InviteUserDialog'
import { BaseRole } from '@/lib/types/permissions'

export function TenantUserManagement() {
  const { profile } = useAuth()

  // Get all memberships for current tenant
  const { data: tenantMemberships, isLoading } = useQuery({
    queryKey: ['tenant-memberships', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return []

      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          profile:profiles(
            email,
            full_name
          )
        `)
        .eq('tenant_id', profile.tenant_id)

      if (error) throw error
      return data
    },
    enabled: !!profile?.tenant_id
  })

  const getRoleBadgeVariant = (role: BaseRole) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'member':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getRoleIcon = (role: BaseRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />
      case 'admin':
        return <Shield className="h-3 w-3" />
      case 'member':
        return <Users className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members</span>
            </CardTitle>
            
            <InviteUserDialog />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenantMemberships?.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {membership.profile?.full_name?.[0] || membership.profile?.email?.[0] || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {membership.profile?.full_name || 'Unknown User'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {membership.profile?.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant={getRoleBadgeVariant(membership.base_role as BaseRole)} className="flex items-center space-x-1">
                    {getRoleIcon(membership.base_role as BaseRole)}
                    <span>{membership.base_role}</span>
                  </Badge>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          Manage Permissions - {membership.profile?.full_name || membership.profile?.email}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <UserPermissionsPanel
                        membershipId={membership.id}
                        tenantId={membership.tenant_id}
                        currentRole={membership.base_role as BaseRole}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}

            {(!tenantMemberships || tenantMemberships.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p>No team members yet</p>
                <p className="text-sm">Invite your first team member to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
