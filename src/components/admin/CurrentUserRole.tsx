import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Crown, Shield, Users, User } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/contexts/AuthProvider'
import { BaseRole } from '@/lib/types/permissions'

export function CurrentUserRole() {
  const { memberships, membershipsLoading } = usePermissions()
  const { profile } = useAuth()

  const getRoleIcon = (role: BaseRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'member':
        return <Users className="h-4 w-4 text-gray-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

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

  if (membershipsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentTenantMembership = memberships?.find(m => m.tenant_id === profile?.tenant_id)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Your Role</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentTenantMembership ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{profile?.full_name || 'Your Account'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <Badge variant={getRoleBadgeVariant(currentTenantMembership.base_role as BaseRole)} className="flex items-center space-x-1">
                {getRoleIcon(currentTenantMembership.base_role as BaseRole)}
                <span>{currentTenantMembership.base_role}</span>
              </Badge>
            </div>
            
            <div className="text-sm">
              <p className="font-medium">Organization: {currentTenantMembership.tenant_name}</p>
              {currentTenantMembership.base_role === 'owner' && (
                <p className="text-muted-foreground mt-1">
                  As an Owner, you have full access to all features and can manage all users.
                </p>
              )}
              {currentTenantMembership.base_role === 'admin' && (
                <p className="text-muted-foreground mt-1">
                  As an Admin, you can manage users and most organizational settings.
                </p>
              )}
              {currentTenantMembership.base_role === 'member' && (
                <p className="text-muted-foreground mt-1">
                  As a Member, you have access to core features based on your specific permissions.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No role assigned in current organization</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
