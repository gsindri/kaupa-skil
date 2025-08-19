
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building, Plus, Users } from 'lucide-react'
import { useAuth } from '@/contexts/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { OnboardingWizard } from './OnboardingWizard'

export function ExistingUserOnboarding() {
  const { user, refetch } = useAuth()
  const { toast } = useToast()
  const [showCreateFlow, setShowCreateFlow] = useState(false)
  const [isJoining, setIsJoining] = useState(false)

  // Get existing organizations (for demo purposes, you might want to limit this)
  const { data: existingTenants } = useQuery({
    queryKey: ['existing-tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const handleJoinOrganization = async (tenantId: string) => {
    if (!user?.id) return

    setIsJoining(true)
    try {
      // Update the user's profile to join this tenant
      const { error } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('id', user.id)

      if (error) throw error

      // Create a membership for this user
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          tenant_id: tenantId,
          user_id: user.id,
          base_role: 'member'
        })

      if (membershipError) throw membershipError

      toast({
        title: 'Joined organization!',
        description: 'You have successfully joined the organization.'
      })

      // Refresh auth to update the user's profile
      await refetch()
    } catch (error: any) {
      console.error('Failed to join organization:', error)
      toast({
        title: 'Failed to join',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsJoining(false)
    }
  }

  if (showCreateFlow) {
    return <OnboardingWizard />
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Building className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Welcome to ProcureWise</h1>
          <p className="text-muted-foreground">
            You need to join or create an organization to get started.
          </p>
        </div>

        <div className="space-y-6">
          {/* Create New Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Organization
              </CardTitle>
              <CardDescription>
                Set up a new organization for your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreateFlow(true)} className="w-full">
                Create Organization
              </Button>
            </CardContent>
          </Card>

          {/* Join Existing Organization */}
          {existingTenants && existingTenants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Join Existing Organization
                </CardTitle>
                <CardDescription>
                  Join one of these existing organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{tenant.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(tenant.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleJoinOrganization(tenant.id)}
                        disabled={isJoining}
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
