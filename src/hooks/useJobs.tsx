import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { useToast } from './use-toast'

export function useJobs() {
  const queryClient = useQueryClient()
  const { user, profile } = useAuth()
  const { toast } = useToast()

  // Get jobs for current tenant
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
    enabled: !!user && !!profile?.tenant_id
  })

  // Get job logs for a specific job
  const getJobLogs = (jobId: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ['job-logs', jobId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('job_logs')
          .select('*')
          .eq('job_id', jobId)
          .order('created_at', { ascending: true })

        if (error) throw error
        return data
      },
      enabled: !!jobId
    })

  // Create a job
  const createJob = useMutation({
    mutationFn: async ({
      type,
      data,
      tenantId
    }: {
      type: string
      data: Record<string, any>
      tenantId?: string
    }) => {
      const { data: result, error } = await supabase
        .from('jobs')
        .insert({
          type,
          data,
          tenant_id: tenantId || profile?.tenant_id,
          requested_by: user?.id
        })
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job created',
        description: 'The job has been queued for processing'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    jobs,
    isLoading,
    createJob,
    getJobLogs
  }
}
