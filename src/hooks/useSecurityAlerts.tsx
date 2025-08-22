
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { queryKeys } from '@/lib/queryKeys'

interface SecurityAlert {
  id: string
  type: 'elevation_abuse' | 'failed_jobs' | 'prolonged_session' | 'policy_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  created_at: string
  resolved_at?: string
}

export function useSecurityAlerts() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: queryKeys.security.alerts(),
    queryFn: async (): Promise<SecurityAlert[]> => {
      // This would normally call a function that aggregates alerts from various sources
      // For now, we'll simulate this by checking the different monitoring functions
      const alerts: SecurityAlert[] = []

      try {
        // Check for suspicious elevations
        const { data: suspiciousElevations } = await supabase.rpc('detect_suspicious_elevations')
        if (suspiciousElevations && suspiciousElevations.length > 0) {
          alerts.push({
            id: 'suspicious-elevations',
            type: 'elevation_abuse',
            severity: 'high',
            title: 'Suspicious Elevation Activity Detected',
            description: `${suspiciousElevations.length} users have unusual elevation patterns`,
            created_at: new Date().toISOString()
          })
        }

        // Check for failed jobs
        const { data: failedJobs } = await supabase.rpc('get_failed_jobs_summary')
        if (failedJobs && failedJobs.length > 0) {
          const totalFailed = failedJobs.reduce(
            (sum: number, job: { failed_count: number }) => sum + Number(job.failed_count),
            0
          )
          if (totalFailed > 10) {
            alerts.push({
              id: 'failed-jobs',
              type: 'failed_jobs',
              severity: totalFailed > 50 ? 'critical' : 'medium',
              title: 'High Number of Failed Jobs',
              description: `${totalFailed} jobs have failed in the last 24 hours`,
              created_at: new Date().toISOString()
            })
          }
        }

        // Check for prolonged elevations
        const { data: prolongedElevations } = await supabase.rpc('get_prolonged_elevations')
        if (prolongedElevations && prolongedElevations.length > 0) {
          alerts.push({
            id: 'prolonged-elevations',
            type: 'prolonged_session',
            severity: 'medium',
            title: 'Prolonged Admin Elevations',
            description: `${prolongedElevations.length} admin sessions are running longer than expected`,
            created_at: new Date().toISOString()
          })
        }

      } catch (error) {
        console.error('Error fetching security alerts:', error)
      }

      return alerts
    },
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  })

  return {
    alerts: alerts || [],
    isLoading,
    criticalCount: alerts?.filter(a => a.severity === 'critical').length || 0,
    highCount: alerts?.filter(a => a.severity === 'high').length || 0
  }
}
