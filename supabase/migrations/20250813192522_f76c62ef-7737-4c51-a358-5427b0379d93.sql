
-- Add performance indexes for security and audit tables
CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created 
ON public.audit_events(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_created 
ON public.audit_events(tenant_id, created_at DESC) 
WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_events_action_created 
ON public.audit_events(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_sessions_actor_ends 
ON public.support_sessions(actor_id, ends_at DESC) 
WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_support_sessions_tenant_active 
ON public.support_sessions(tenant_id, ends_at DESC) 
WHERE revoked_at IS NULL AND ends_at > NOW();

CREATE INDEX IF NOT EXISTS idx_jobs_status_tenant 
ON public.jobs(status, tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created 
ON public.jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_created 
ON public.job_logs(job_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_admin_elevations_user_expires 
ON public.admin_elevations(user_id, expires_at DESC) 
WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_elevations_active 
ON public.admin_elevations(expires_at DESC) 
WHERE revoked_at IS NULL AND expires_at > NOW();

-- Create monitoring and alerting functions
CREATE OR REPLACE FUNCTION public.detect_suspicious_elevations()
RETURNS TABLE(
  user_id uuid,
  elevation_count bigint,
  last_elevation timestamp with time zone,
  total_duration_minutes integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ae.user_id,
    COUNT(*) as elevation_count,
    MAX(ae.created_at) as last_elevation,
    SUM(EXTRACT(EPOCH FROM (COALESCE(ae.revoked_at, ae.expires_at) - ae.created_at))/60)::integer as total_duration_minutes
  FROM public.admin_elevations ae
  WHERE ae.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY ae.user_id
  HAVING COUNT(*) > 3 OR SUM(EXTRACT(EPOCH FROM (COALESCE(ae.revoked_at, ae.expires_at) - ae.created_at))/60) > 120
  ORDER BY elevation_count DESC, total_duration_minutes DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_failed_jobs_summary()
RETURNS TABLE(
  job_type text,
  failed_count bigint,
  last_failure timestamp with time zone,
  common_error text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    j.type as job_type,
    COUNT(*) as failed_count,
    MAX(j.completed_at) as last_failure,
    MODE() WITHIN GROUP (ORDER BY j.error_message) as common_error
  FROM public.jobs j
  WHERE j.status = 'failed' 
    AND j.completed_at >= NOW() - INTERVAL '24 hours'
  GROUP BY j.type
  ORDER BY failed_count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_prolonged_elevations()
RETURNS TABLE(
  elevation_id uuid,
  user_id uuid,
  reason text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  duration_minutes integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ae.id as elevation_id,
    ae.user_id,
    ae.reason,
    ae.created_at,
    ae.expires_at,
    EXTRACT(EPOCH FROM (ae.expires_at - ae.created_at))/60 as duration_minutes
  FROM public.admin_elevations ae
  WHERE ae.revoked_at IS NULL 
    AND ae.expires_at > NOW()
    AND EXTRACT(EPOCH FROM (ae.expires_at - ae.created_at))/60 > 60
  ORDER BY duration_minutes DESC;
$$;

CREATE OR REPLACE FUNCTION public.audit_security_events()
RETURNS TABLE(
  event_type text,
  event_count bigint,
  unique_actors bigint,
  last_occurrence timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    ae.action as event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT ae.actor_id) as unique_actors,
    MAX(ae.created_at) as last_occurrence
  FROM public.audit_events ae
  WHERE ae.action IN (
    'elevation_created', 'elevation_revoked',
    'support_session_created', 'support_session_revoked',
    'admin_action_approved', 'admin_action_rejected'
  )
  AND ae.created_at >= NOW() - INTERVAL '24 hours'
  GROUP BY ae.action
  ORDER BY event_count DESC;
$$;

-- Create a comprehensive security validation function
CREATE OR REPLACE FUNCTION public.validate_security_policies()
RETURNS TABLE(
  table_name text,
  has_rls boolean,
  policy_count bigint,
  status text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.relname as table_name,
    c.relrowsecurity as has_rls,
    COUNT(p.polname) as policy_count,
    CASE 
      WHEN c.relrowsecurity = false THEN 'RISK: RLS Disabled'
      WHEN COUNT(p.polname) = 0 THEN 'RISK: No Policies'
      WHEN COUNT(p.polname) < 2 THEN 'WARNING: Few Policies'
      ELSE 'OK'
    END as status
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_policy p ON p.polrelid = c.oid
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
  GROUP BY c.relname, c.relrowsecurity
  ORDER BY 
    CASE status 
      WHEN 'RISK: RLS Disabled' THEN 1
      WHEN 'RISK: No Policies' THEN 2  
      WHEN 'WARNING: Few Policies' THEN 3
      ELSE 4
    END,
    c.relname;
$$;

-- Create alert trigger for prolonged elevations
CREATE OR REPLACE FUNCTION public.alert_prolonged_elevation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log alert for elevations longer than 2 hours
  IF EXTRACT(EPOCH FROM (NEW.expires_at - NEW.created_at))/60 > 120 THEN
    PERFORM public.log_audit_event(
      'prolonged_elevation_alert',
      'admin_elevation',
      NEW.id,
      'Elevation duration exceeds 2 hours',
      jsonb_build_object(
        'duration_minutes', EXTRACT(EPOCH FROM (NEW.expires_at - NEW.created_at))/60,
        'reason', NEW.reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add trigger for prolonged elevation alerts
DROP TRIGGER IF EXISTS trigger_alert_prolonged_elevation ON public.admin_elevations;
CREATE TRIGGER trigger_alert_prolonged_elevation
  AFTER INSERT ON public.admin_elevations
  FOR EACH ROW
  EXECUTE FUNCTION public.alert_prolonged_elevation();

-- Create function to check for security definer function usage
CREATE OR REPLACE FUNCTION public.audit_security_definer_functions()
RETURNS TABLE(
  function_name text,
  schema_name text,
  is_security_definer boolean,
  owner text,
  language text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    p.prosecdef as is_security_definer,
    r.rolname as owner,
    l.lanname as language
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  JOIN pg_authid r ON r.oid = p.proowner
  JOIN pg_language l ON l.oid = p.prolang
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
  ORDER BY p.proname;
$$;
