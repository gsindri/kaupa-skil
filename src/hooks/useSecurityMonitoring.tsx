
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

interface SuspiciousElevation {
  user_id: string
  elevation_count: number
  last_elevation: string
  total_duration_minutes: number
}

interface FailedJobSummary {
  job_type: string
  failed_count: number
  last_failure: string
  common_error: string
}

interface ProlongedElevation {
  elevation_id: string
  user_id: string
  reason: string
  created_at: string
  expires_at: string
  duration_minutes: number
}

interface SecurityEvent {
  event_type: string
  event_count: number
  unique_actors: number
  last_occurrence: string
}

interface SecurityPolicy {
  table_name: string
  has_rls: boolean
  policy_count: number
  status: string
}

interface SecurityDefinerFunction {
  function_name: string
  schema_name: string
  is_security_definer: boolean
  owner: string
  language: string
}

export function useSecurityMonitoring() {
  const { data: suspiciousElevations, isLoading: loadingSuspicious } = useQuery({
    queryKey: ['suspicious-elevations'],
    queryFn: async (): Promise<SuspiciousElevation[]> => {
      const { data, error } = await supabase.rpc('detect_suspicious_elevations')
      if (error) throw error
      return data || []
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  })

  const { data: failedJobs, isLoading: loadingFailedJobs } = useQuery({
    queryKey: ['failed-jobs-summary'],
    queryFn: async (): Promise<FailedJobSummary[]> => {
      const { data, error } = await supabase.rpc('get_failed_jobs_summary')
      if (error) throw error
      return data || []
    },
    refetchInterval: 2 * 60 * 1000 // Refresh every 2 minutes
  })

  const { data: prolongedElevations, isLoading: loadingProlonged } = useQuery({
    queryKey: ['prolonged-elevations'],
    queryFn: async (): Promise<ProlongedElevation[]> => {
      const { data, error } = await supabase.rpc('get_prolonged_elevations')
      if (error) throw error
      return data || []
    },
    refetchInterval: 60 * 1000 // Refresh every minute
  })

  const { data: securityEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['security-events'],
    queryFn: async (): Promise<SecurityEvent[]> => {
      const { data, error } = await supabase.rpc('audit_security_events')
      if (error) throw error
      return data || []
    },
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes
  })

  const { data: securityPolicies, isLoading: loadingPolicies } = useQuery({
    queryKey: ['security-policies'],
    queryFn: async (): Promise<SecurityPolicy[]> => {
      const { data, error } = await supabase.rpc('validate_security_policies')
      if (error) throw error
      return data || []
    },
    refetchInterval: 10 * 60 * 1000 // Refresh every 10 minutes
  })

  const { data: securityDefinerFunctions, isLoading: loadingFunctions } = useQuery({
    queryKey: ['security-definer-functions'],
    queryFn: async (): Promise<SecurityDefinerFunction[]> => {
      const { data, error } = await supabase.rpc('audit_security_definer_functions')
      if (error) throw error
      return data || []
    },
    refetchInterval: 30 * 60 * 1000 // Refresh every 30 minutes
  })

  return {
    suspiciousElevations,
    failedJobs,
    prolongedElevations,
    securityEvents,
    securityPolicies,
    securityDefinerFunctions,
    isLoading: loadingSuspicious || loadingFailedJobs || loadingProlonged || 
               loadingEvents || loadingPolicies || loadingFunctions
  }
}
