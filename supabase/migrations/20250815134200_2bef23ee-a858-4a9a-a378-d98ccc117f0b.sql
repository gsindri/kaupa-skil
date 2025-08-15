
-- Fix all security-critical database functions with proper search_path setting
-- This prevents SQL injection attacks through search path manipulation

-- 1. Fix has_capability function
CREATE OR REPLACE FUNCTION public.has_capability(cap text, target_scope text, target_id uuid DEFAULT NULL::uuid, want jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- 2. Fix create_elevation function
CREATE OR REPLACE FUNCTION public.create_elevation(reason_text text, duration_minutes integer DEFAULT 30)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- 3. Fix create_support_session function
CREATE OR REPLACE FUNCTION public.create_support_session(target_tenant_id uuid, reason_text text, duration_minutes integer DEFAULT 60)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- 4. Fix log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(action_name text, entity_type_name text DEFAULT NULL::text, entity_id_val uuid DEFAULT NULL::uuid, reason_text text DEFAULT NULL::text, meta_data_val jsonb DEFAULT '{}'::jsonb, tenant_id_val uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- 5. Fix revoke_elevation function
CREATE OR REPLACE FUNCTION public.revoke_elevation(elevation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- 6. Fix is_platform_admin function
CREATE OR REPLACE FUNCTION public.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid() AND is_active = true
  );
$function$;

-- 7. Fix is_owner function
CREATE OR REPLACE FUNCTION public.is_owner(_tenant_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  select exists (
    select 1
    from public.memberships m
    where m.tenant_id = _tenant_id
      and m.user_id = auth.uid()
      and m.base_role = 'owner'
  );
$function$;

-- 8. Fix get_user_memberships function
CREATE OR REPLACE FUNCTION public.get_user_memberships()
 RETURNS TABLE(membership_id uuid, tenant_id uuid, tenant_name text, base_role text, attrs jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  select 
    m.id as membership_id,
    m.tenant_id,
    t.name as tenant_name,
    m.base_role,
    m.attrs
  from public.memberships m
  join public.tenants t on t.id = m.tenant_id
  where m.user_id = auth.uid();
$function$;

-- 9. Fix setup_owner_grants function
CREATE OR REPLACE FUNCTION public.setup_owner_grants(_membership_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
declare
  _tenant_id uuid;
begin
  select m.tenant_id into _tenant_id
  from public.memberships m
  where m.id = _membership_id;

  if _tenant_id is null then
    return;
  end if;

  insert into public.grants (tenant_id, membership_id, capability, scope) values
    (_tenant_id, _membership_id, 'manage_tenant_users', 'tenant'),
    (_tenant_id, _membership_id, 'view_prices', 'tenant'),
    (_tenant_id, _membership_id, 'compose_order', 'tenant'),
    (_tenant_id, _membership_id, 'dispatch_order_email', 'tenant'),
    (_tenant_id, _membership_id, 'run_ingestion', 'tenant'),
    (_tenant_id, _membership_id, 'manage_credentials', 'tenant'),
    (_tenant_id, _membership_id, 'manage_supplier_links', 'tenant'),
    (_tenant_id, _membership_id, 'view_price_history', 'tenant'),
    (_tenant_id, _membership_id, 'read_reports', 'tenant'),
    (_tenant_id, _membership_id, 'manage_vat_rules', 'tenant'),
    (_tenant_id, _membership_id, 'read_audit_logs', 'tenant')
  on conflict do nothing;
end;
$function$;

-- 10. Fix has_active_elevation function
CREATE OR REPLACE FUNCTION public.has_active_elevation()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_elevations ae
    WHERE ae.user_id = auth.uid()
      AND ae.expires_at > NOW()
      AND ae.revoked_at IS NULL
  );
$function$;

-- 11. Fix has_support_session function
CREATE OR REPLACE FUNCTION public.has_support_session(target_tenant uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.support_sessions ss
    WHERE ss.actor_id = auth.uid()
      AND ss.tenant_id = target_tenant
      AND NOW() BETWEEN ss.starts_at AND ss.ends_at
      AND ss.revoked_at IS NULL
  );
$function$;

-- 12. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$function$;

-- 13. Fix before_insert_tenant_set_creator function
CREATE OR REPLACE FUNCTION public.before_insert_tenant_set_creator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$function$;

-- 14. Fix handle_new_tenant_after function
CREATE OR REPLACE FUNCTION public.handle_new_tenant_after()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
declare
  new_membership_id uuid;
begin
  -- Create Owner membership for creator
  insert into public.memberships (tenant_id, user_id, base_role)
  values (new.id, new.created_by, 'owner')
  on conflict (tenant_id, user_id) do nothing
  returning id into new_membership_id;

  if new_membership_id is not null then
    perform public.setup_owner_grants(new_membership_id);
  end if;

  return new;
end;
$function$;
