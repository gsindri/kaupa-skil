import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Mail, Crown, Shield, Users } from 'lucide-react'
import { useUserInvitation } from '@/hooks/useUserInvitation'
import { useAuth } from '@/contexts/AuthProvider'
import { BaseRole } from '@/lib/types/permissions'

export function InviteUserDialog() {
  const { profile } = useAuth()
  const { inviteUser } = useUserInvitation()
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserFullName, setNewUserFullName] = useState('')
  const [newUserRole, setNewUserRole] = useState<BaseRole>('member')
  const [isOpen, setIsOpen] = useState(false)

  const handleAddUser = async () => {
    if (!newUserEmail || !profile?.tenant_id) return

    try {
      await inviteUser.mutateAsync({
        email: newUserEmail,
        tenantId: profile.tenant_id,
        baseRole: newUserRole,
        fullName: newUserFullName
      })

      setIsOpen(false)
      setNewUserEmail('')
      setNewUserFullName('')
      setNewUserRole('member')
    } catch (error) {
      // Error is handled by the hook's onError
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
