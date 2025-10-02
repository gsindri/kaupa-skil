import { useQuery } from '@tanstack/react-query'
import { differenceInHours } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface ApprovalsSummary {
  pendingCount: number
  oldestPendingHours: number
}

export function useApprovalsSummary() {
  const { profile } = useAuth()
  const workspaceId = profile?.tenant_id ?? null

  return useQuery<ApprovalsSummary>({
    queryKey: [...queryKeys.dashboard.approvals(), workspaceId],
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
    queryFn: async () => {
      if (!workspaceId) {
        return { pendingCount: 0, oldestPendingHours: 0 }
      }

      const { data, error } = await supabase
        .from('orders')
        .select('id, created_at, status')
        .eq('tenant_id', workspaceId)
        .eq('status', 'pending_approval')

      if (error) {
        console.warn('Failed to fetch approvals summary', error)
        return { pendingCount: 0, oldestPendingHours: 0 }
      }

      const pending = data ?? []
      if (pending.length === 0) {
        return { pendingCount: 0, oldestPendingHours: 0 }
      }

      const oldestCreatedAt = pending
        .map((item: any) => item?.created_at)
        .filter(Boolean)
        .sort()[0]

      const oldestPendingHours = oldestCreatedAt
        ? differenceInHours(new Date(), new Date(oldestCreatedAt))
        : 0

      return {
        pendingCount: pending.length,
        oldestPendingHours,
      }
    },
  })
}
