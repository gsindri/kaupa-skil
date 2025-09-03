-- Address the remaining Security Definer function issue
-- The get_user_memberships function might be flagged by the linter

-- Check if we can make get_user_memberships work without SECURITY DEFINER
-- This function needs to access membership data, so let's see if we can use RLS instead

CREATE OR REPLACE FUNCTION public.get_user_memberships()
RETURNS TABLE(membership_id uuid, tenant_id uuid, tenant_name text, base_role text, attrs jsonb)
LANGUAGE sql
STABLE
-- Removed SECURITY DEFINER to see if RLS policies are sufficient
SET search_path = public
AS $$
  SELECT 
    m.id as membership_id,
    m.tenant_id,
    t.name as tenant_name,
    m.base_role,
    m.attrs
  FROM public.memberships m
  JOIN public.tenants t ON t.id = m.tenant_id
  WHERE m.user_id = auth.uid();
$$;