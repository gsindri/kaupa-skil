-- Create a secure platform admin setup function
-- This allows the first authenticated user to become a platform admin

CREATE OR REPLACE FUNCTION public.setup_initial_platform_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  admin_count integer;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if there are already any platform admins
  SELECT COUNT(*) INTO admin_count 
  FROM public.platform_admins 
  WHERE is_active = true;
  
  -- Only allow setup if no platform admins exist yet
  IF admin_count > 0 THEN
    RETURN false;
  END IF;
  
  -- Create the first platform admin
  INSERT INTO public.platform_admins (user_id, is_active, created_by)
  VALUES (current_user_id, true, current_user_id)
  ON CONFLICT (user_id) DO UPDATE SET
    is_active = true,
    created_by = current_user_id;
  
  -- Log the admin creation
  INSERT INTO public.audit_events (
    actor_id,
    action,
    entity_type,
    entity_id,
    reason,
    meta_data
  ) VALUES (
    current_user_id,
    'platform_admin_created',
    'platform_admin',
    current_user_id,
    'Initial platform admin setup',
    jsonb_build_object('is_initial_setup', true)
  );
  
  RETURN true;
END;
$$;