
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Settings, Users, Mail } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { UserPermissionsPanel } from './UserPermissionsPanel'
import { BaseRole } from '@/lib/types/permissions'

export function TenantUserManagement() {
  const { profile } = useAuth()
  const { createMembership } = usePermissions()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [newUserEmail, setNewUserEmail] = useState('')
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

    // In a real implementation, you'd need to:
    // 1. Check if user exists in auth.users by email
    // 2. If not, send an invitation
    // 3. Create the membership

    // For now, we'll simulate this
    console.log('Would invite user:', newUserEmail, 'with role:', newUserRole)
    setIsAddingUser(false)
    setNewUserEmail('')
    setNewUserRole('member')
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
                  Add User
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
                    <Label htmlFor="role">Base Role</Label>
                    <Select value={newUserRole} onValueChange={(value: BaseRole) => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={handleAddUser} className="flex-1">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
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
                  <Badge variant={getRoleBadgeVariant(membership.base_role as BaseRole)}>
                    {membership.base_role}
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
