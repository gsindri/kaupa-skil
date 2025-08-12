
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Settings, Users, Mail, Crown, Shield } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useUserInvitation } from '@/hooks/useUserInvitation'
import { UserPermissionsPanel } from './UserPermissionsPanel'
import { BaseRole } from '@/lib/types/permissions'

export function TenantUserManagement() {
  const { profile } = useAuth()
  const { inviteUser } = useUserInvitation()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserFullName, setNewUserFullName] = useState('')
  const [newUserRole, setNewUserRole] = useState<BaseRole>('member')
  const [isAddingUser, setIsAddingUser] = useState(false)

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

  const handleAddUser = async () => {
    if (!newUserEmail || !profile?.tenant_id) return

    try {
      await inviteUser.mutateAsync({
        email: newUserEmail,
        tenantId: profile.tenant_id,
        baseRole: newUserRole,
        fullName: newUserFullName
      })

      setIsAddingUser(false)
      setNewUserEmail('')
      setNewUserFullName('')
      setNewUserRole('member')
    } catch (error) {
      // Error is handled by the hook's onError
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
            
            <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="colleague@company.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="fullName">Full Name (Optional)</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Base Role</Label>
                    <Select value={newUserRole} onValueChange={(value: BaseRole) => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Member</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>Admin</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="owner">
                          <div className="flex items-center space-x-2">
                            <Crown className="h-4 w-4" />
                            <span>Owner</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleAddUser} 
                      className="flex-1"
                      disabled={inviteUser.isPending || !newUserEmail}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {inviteUser.isPending ? 'Sending...' : 'Send Invitation'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
