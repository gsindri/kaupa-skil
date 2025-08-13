
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

export function PendingAdminActions() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: pendingActions, isLoading } = useQuery({
    queryKey: ['pending-admin-actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_admin_actions')
        .select('*')
        .is('approved_at', null)
        .is('rejected_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!user
  })

  const approveAction = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from('pending_admin_actions')
        .update({
          approved_at: new Date().toISOString(),
          approved_by: user?.id
        })
        .eq('id', actionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-admin-actions'] })
      toast({
        title: 'Action approved',
        description: 'The admin action has been approved and will be processed'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to approve action',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const rejectAction = useMutation({
    mutationFn: async ({ actionId, reason }: { actionId: string; reason: string }) => {
      const { error } = await supabase
        .from('pending_admin_actions')
        .update({
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id,
          rejection_reason: reason
        })
        .eq('id', actionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-admin-actions'] })
      toast({
        title: 'Action rejected',
        description: 'The admin action has been rejected'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to reject action',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Pending Admin Actions
        </CardTitle>
        <CardDescription>
          Actions requiring two-person approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingActions?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pending actions</p>
            </div>
          ) : (
            pendingActions?.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{action.action_type}</p>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {action.reason}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requested: {new Date(action.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectAction.mutate({ 
                      actionId: action.id, 
                      reason: 'Rejected by admin' 
                    })}
                    disabled={rejectAction.isPending || action.requester_id === user?.id}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveAction.mutate(action.id)}
                    disabled={approveAction.isPending || action.requester_id === user?.id}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
