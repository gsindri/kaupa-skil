
import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Play, X, FileText } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useJobs } from '@/hooks/useJobs'
import { useToast } from '@/hooks/use-toast'

export function JobManagement() {
  const { jobs } = useJobs()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'pending',
          error_message: null,
          retry_count: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', jobId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job retried',
        description: 'The job has been queued for retry'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to retry job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const cancelJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'failed',
          error_message: 'Cancelled by admin',
          finished_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'pending')

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      toast({
        title: 'Job cancelled',
        description: 'The job has been cancelled'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to cancel job',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'failed': return 'destructive'
      case 'running': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Job Management
        </CardTitle>
        <CardDescription>
          Monitor and manage background jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs?.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{job.type}</p>
                  <Badge variant={getStatusVariant(job.status)}>
                    {job.status}
                  </Badge>
                  {job.retry_count > 0 && (
                    <Badge variant="outline">
                      Retry {job.retry_count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(job.created_at).toLocaleString()}
                </p>
                {job.started_at && (
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(job.started_at).toLocaleString()}
                  </p>
                )}
                {job.error_message && (
                  <p className="text-sm text-red-600">{job.error_message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {job.status === 'failed' && job.retry_count < (job.max_retries || 3) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryJob.mutate(job.id)}
                    disabled={retryJob.isPending}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
                {job.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelJob.mutate(job.id)}
                    disabled={cancelJob.isPending}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                )}
                  <Button size="sm" variant="ghost" aria-label="View job details">
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
