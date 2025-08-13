
-- Fix infinite recursion in platform_admins RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Platform admins can manage platform admin records" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can view all platform admin records" ON public.platform_admins;

-- Create a security definer function to safely check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- Create new safe RLS policies that don't cause recursion
CREATE POLICY "Users can view their own platform admin record"
  ON public.platform_admins
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Platform admins can view all records"
  ON public.platform_admins
  FOR SELECT
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins can insert new records"
  ON public.platform_admins
  FOR INSERT
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update records"
  ON public.platform_admins
  FOR UPDATE
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can delete records"
  ON public.platform_admins
  FOR DELETE
  USING (public.is_platform_admin());
