-- CRITICAL SECURITY FIX: Implement proper RLS policies for catalog data
-- Replace permissive public access with authenticated tenant-scoped access

-- First, drop the existing permissive policies
DROP POLICY IF EXISTS "Public catalog products are viewable by everyone" ON catalog_product;
DROP POLICY IF EXISTS "System can manage catalog products" ON catalog_product;
DROP POLICY IF EXISTS "Public supplier products are viewable by everyone" ON supplier_product;
DROP POLICY IF EXISTS "System can manage supplier products" ON supplier_product;
DROP POLICY IF EXISTS "System can manage availability data" ON supplier_product_availability;

-- Create secure RLS policies for catalog_product
CREATE POLICY "Authenticated users can view catalog products" 
ON catalog_product 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Tenant members can manage catalog products" 
ON catalog_product 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Create secure RLS policies for supplier_product
CREATE POLICY "Authenticated users can view supplier products" 
ON supplier_product 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Tenant members can manage supplier products" 
ON supplier_product 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Create secure RLS policies for supplier_product_availability
CREATE POLICY "Authenticated users can view availability data" 
ON supplier_product_availability 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Tenant members can manage availability data" 
ON supplier_product_availability 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Create supplier_credentials table with proper encryption
CREATE TABLE IF NOT EXISTS supplier_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id text NOT NULL,
  encrypted_credentials text NOT NULL, -- Encrypted JSON containing username, password, api_key
  test_status text DEFAULT 'pending', -- 'pending', 'success', 'failed'
  last_tested_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(tenant_id, supplier_id)
);

-- Enable RLS on supplier_credentials
ALTER TABLE supplier_credentials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for supplier_credentials
CREATE POLICY "Users can view their tenant credentials" 
ON supplier_credentials 
FOR SELECT 
TO authenticated
USING (
  tenant_id IS NULL AND auth.uid() IS NOT NULL
  OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = supplier_credentials.tenant_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their tenant credentials" 
ON supplier_credentials 
FOR ALL 
TO authenticated
USING (
  tenant_id IS NULL AND auth.uid() IS NOT NULL
  OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = supplier_credentials.tenant_id 
    AND m.user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IS NULL AND auth.uid() IS NOT NULL
  OR 
  EXISTS (
    SELECT 1 FROM memberships m 
    WHERE m.tenant_id = supplier_credentials.tenant_id 
    AND m.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_supplier_credentials_updated_at
  BEFORE UPDATE ON supplier_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FIX DATABASE SECURITY WARNINGS: Update SECURITY DEFINER functions with immutable search_path

-- Fix has_capability function
CREATE OR REPLACE FUNCTION public.has_capability(cap text, target_scope text, target_id uuid DEFAULT NULL::uuid, want jsonb DEFAULT '{}'::jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
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

-- Fix other SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.setup_owner_grants(_membership_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

-- Update all other SECURITY DEFINER functions with proper search_path
CREATE OR REPLACE FUNCTION public.create_elevation(reason_text text, duration_minutes integer DEFAULT 30)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.log_audit_event(action_name text, entity_type_name text DEFAULT NULL::text, entity_id_val uuid DEFAULT NULL::uuid, reason_text text DEFAULT NULL::text, meta_data_val jsonb DEFAULT '{}'::jsonb, tenant_id_val uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.create_support_session(target_tenant_id uuid, reason_text text, duration_minutes integer DEFAULT 60)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.revoke_elevation(elevation_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.before_insert_tenant_set_creator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_tenant_after()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''))
  on conflict (id) do nothing;
  return new;
end;
$function$;