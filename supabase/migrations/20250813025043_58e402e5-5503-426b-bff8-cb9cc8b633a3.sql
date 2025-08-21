
-- Phase 1: Database Primitives for Enhanced Security & Administration

-- 1. Platform admins table for break-glass accounts
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- 2. Admin elevations for JIT privilege escalation
CREATE TABLE public.admin_elevations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id)
);

-- 3. Support sessions for consented impersonation
CREATE TABLE public.support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Audit events for comprehensive logging
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  tenant_id UUID REFERENCES public.tenants(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  reason TEXT,
  meta_data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Pending admin actions for two-person rule
CREATE TABLE public.pending_admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  target_entity_type TEXT,
  target_entity_id UUID,
  reason TEXT NOT NULL,
  action_data JSONB DEFAULT '{}',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Jobs table for async admin operations
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  tenant_id UUID REFERENCES public.tenants(id),
  requested_by UUID REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  data JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Job logs for detailed execution tracking
CREATE TABLE public.job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_elevations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for platform_admins
CREATE POLICY "Platform admins can view all platform admin records" ON public.platform_admins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active)
  );

CREATE POLICY "Platform admins can manage platform admin records" ON public.platform_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active)
  );

-- RLS Policies for admin_elevations
CREATE POLICY "Users can view their own elevations" ON public.admin_elevations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Platform admins can view all elevations" ON public.admin_elevations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active)
  );

CREATE POLICY "Users can create their own elevations" ON public.admin_elevations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can revoke their own elevations" ON public.admin_elevations
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for support_sessions
CREATE POLICY "Actors can view their own support sessions" ON public.support_sessions
  FOR SELECT USING (actor_id = auth.uid());

CREATE POLICY "Tenant members can view support sessions for their tenant" ON public.support_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.tenant_id = support_sessions.tenant_id AND m.user_id = auth.uid())
  );

CREATE POLICY "Support actors can create sessions" ON public.support_sessions
  FOR INSERT WITH CHECK (actor_id = auth.uid());

CREATE POLICY "Session participants can revoke sessions" ON public.support_sessions
  FOR UPDATE USING (
    actor_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.tenant_id = support_sessions.tenant_id AND m.user_id = auth.uid())
  );

-- RLS Policies for audit_events
CREATE POLICY "Platform admins can view all audit events" ON public.audit_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active)
  );

CREATE POLICY "Tenant members can view their tenant audit events" ON public.audit_events
  FOR SELECT USING (
    tenant_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.tenant_id = audit_events.tenant_id AND m.user_id = auth.uid())
  );

CREATE POLICY "System can insert audit events" ON public.audit_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for pending_admin_actions
CREATE POLICY "Requesters can view their own pending actions" ON public.pending_admin_actions
  FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Platform admins can view all pending actions" ON public.pending_admin_actions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active)
  );

CREATE POLICY "Users can create pending actions" ON public.pending_admin_actions
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Platform admins can approve/reject actions" ON public.pending_admin_actions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active)
  );

-- RLS Policies for jobs
CREATE POLICY "Requesters can view their own jobs" ON public.jobs
  FOR SELECT USING (requested_by = auth.uid());

CREATE POLICY "Tenant members can view tenant jobs" ON public.jobs
  FOR SELECT USING (
    tenant_id IS NOT NULL AND 
    EXISTS (SELECT 1 FROM public.memberships m WHERE m.tenant_id = jobs.tenant_id AND m.user_id = auth.uid())
  );

CREATE POLICY "System can manage jobs" ON public.jobs
  TO service_role
  FOR INSERT, UPDATE, DELETE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for job_logs
CREATE POLICY "Job requesters can view logs" ON public.job_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_logs.job_id AND j.requested_by = auth.uid())
  );

CREATE POLICY "System can insert job logs" ON public.job_logs
  FOR INSERT WITH CHECK (true);

-- Enhanced has_capability function with elevation support
CREATE OR REPLACE FUNCTION public.has_capability(cap text, target_scope text, target_id uuid DEFAULT NULL::uuid, want jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
declare
  mid uuid;
  ok boolean;
  active_tenant uuid;
  setting text;
  is_elevated boolean := false;
begin
  -- Check for active elevation (platform superadmin)
  SELECT EXISTS (
    SELECT 1 FROM public.admin_elevations ae
    WHERE ae.user_id = auth.uid()
      AND ae.expires_at > NOW()
      AND ae.revoked_at IS NULL
  ) INTO is_elevated;
  
  -- Platform superadmins can do anything during elevation
  IF is_elevated THEN
    RETURN true;
  END IF;

  -- Check for platform admin status (for certain global capabilities)
  IF cap IN ('manage_platform_users', 'view_all_audit_logs', 'approve_admin_actions') THEN
    RETURN EXISTS (
      SELECT 1 FROM public.platform_admins pa
      WHERE pa.user_id = auth.uid() AND pa.is_active
    );
  END IF;

  -- Prefer profile.tenant_id if set
  select p.tenant_id into active_tenant
  from public.profiles p
  where p.id = auth.uid();

  -- Otherwise, check for a request-scoped setting (optional)
  if active_tenant is null then
    begin
      setting := current_setting('app.tenant_id', true);
      if setting is not null then
        active_tenant := setting::uuid;
      end if;
    exception when others then
      active_tenant := null;
    end;
  end if;

  -- Fallback: first membership's tenant
  if active_tenant is null then
    select m.tenant_id into active_tenant
    from public.memberships m
    where m.user_id = auth.uid()
    limit 1;
  end if;

  if active_tenant is null then
    return false;
  end if;

  -- Locate the membership id
  select m.id into mid
  from public.memberships m
  where m.tenant_id = active_tenant
    and m.user_id = auth.uid();

  if mid is null then
    return false;
  end if;

  -- Owner shortcut
  if exists (
    select 1 from public.memberships where id = mid and base_role = 'owner'
  ) then
    return true;
  end if;

  -- Match a grant by capability + scope (accept NULL scope_id as wildcard)
  select true into ok
  from public.grants g
  where g.membership_id = mid
    and g.capability = cap
    and g.scope = target_scope
    and (g.scope_id is null or g.scope_id = target_id)
  limit 1;

  return coalesce(ok, false);
end
$$;

-- Function to check if user has active elevation
CREATE OR REPLACE FUNCTION public.has_active_elevation()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_elevations ae
    WHERE ae.user_id = auth.uid()
      AND ae.expires_at > NOW()
      AND ae.revoked_at IS NULL
  );
$$;

-- Function to check if user has active support session for tenant
CREATE OR REPLACE FUNCTION public.has_support_session(target_tenant uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.support_sessions ss
    WHERE ss.actor_id = auth.uid()
      AND ss.tenant_id = target_tenant
      AND NOW() BETWEEN ss.starts_at AND ss.ends_at
      AND ss.revoked_at IS NULL
  );
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  action_name text,
  entity_type_name text DEFAULT NULL,
  entity_id_val uuid DEFAULT NULL,
  reason_text text DEFAULT NULL,
  meta_data_val jsonb DEFAULT '{}'::jsonb,
  tenant_id_val uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  event_id uuid;
begin
  INSERT INTO public.audit_events (
    actor_id,
    tenant_id,
    action,
    entity_type,
    entity_id,
    reason,
    meta_data
  ) VALUES (
    auth.uid(),
    tenant_id_val,
    action_name,
    entity_type_name,
    entity_id_val,
    reason_text,
    meta_data_val
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
end
$$;

-- Admin function to create elevation
CREATE OR REPLACE FUNCTION public.create_elevation(reason_text text, duration_minutes integer DEFAULT 30)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  elevation_id uuid;
  is_platform_admin boolean;
begin
  -- Check if user is a platform admin
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid() AND pa.is_active
  ) INTO is_platform_admin;
  
  IF NOT is_platform_admin THEN
    RAISE EXCEPTION 'Only platform admins can create elevations';
  END IF;

  -- Create elevation
  INSERT INTO public.admin_elevations (
    user_id,
    reason,
    expires_at
  ) VALUES (
    auth.uid(),
    reason_text,
    NOW() + (duration_minutes || ' minutes')::interval
  ) RETURNING id INTO elevation_id;
  
  -- Log the elevation
  PERFORM public.log_audit_event(
    'elevation_created',
    'admin_elevation',
    elevation_id,
    reason_text,
    jsonb_build_object('duration_minutes', duration_minutes)
  );
  
  RETURN elevation_id;
end
$$;

-- Admin function to revoke elevation
CREATE OR REPLACE FUNCTION public.revoke_elevation(elevation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  UPDATE public.admin_elevations
  SET revoked_at = NOW(), revoked_by = auth.uid()
  WHERE id = elevation_id
    AND user_id = auth.uid()
    AND revoked_at IS NULL;
  
  IF FOUND THEN
    PERFORM public.log_audit_event(
      'elevation_revoked',
      'admin_elevation',
      elevation_id,
      'Manual revocation'
    );
    RETURN true;
  END IF;
  
  RETURN false;
end
$$;

-- Function to create support session
CREATE OR REPLACE FUNCTION public.create_support_session(
  target_tenant_id uuid,
  reason_text text,
  duration_minutes integer DEFAULT 60
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  session_id uuid;
  is_platform_admin boolean;
begin
  -- Check if user is a platform admin
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid() AND pa.is_active
  ) INTO is_platform_admin;
  
  IF NOT is_platform_admin THEN
    RAISE EXCEPTION 'Only platform admins can create support sessions';
  END IF;

  -- Create support session
  INSERT INTO public.support_sessions (
    actor_id,
    tenant_id,
    reason,
    ends_at
  ) VALUES (
    auth.uid(),
    target_tenant_id,
    reason_text,
    NOW() + (duration_minutes || ' minutes')::interval
  ) RETURNING id INTO session_id;
  
  -- Log the session creation
  PERFORM public.log_audit_event(
    'support_session_created',
    'support_session',
    session_id,
    reason_text,
    jsonb_build_object('tenant_id', target_tenant_id, 'duration_minutes', duration_minutes),
    target_tenant_id
  );
  
  RETURN session_id;
end
$$;

-- Create indexes for performance
CREATE INDEX idx_admin_elevations_user_active ON public.admin_elevations(user_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_support_sessions_active ON public.support_sessions(actor_id, tenant_id, starts_at, ends_at) WHERE revoked_at IS NULL;
CREATE INDEX idx_audit_events_tenant_time ON public.audit_events(tenant_id, created_at);
CREATE INDEX idx_audit_events_actor_time ON public.audit_events(actor_id, created_at);
CREATE INDEX idx_jobs_status_tenant ON public.jobs(status, tenant_id, created_at);
CREATE INDEX idx_job_logs_job_time ON public.job_logs(job_id, created_at);
