-- First, add 'personal' as a valid tenant kind
ALTER TABLE public.tenants DROP CONSTRAINT IF EXISTS tenants_kind_check;
ALTER TABLE public.tenants ADD CONSTRAINT tenants_kind_check 
  CHECK (kind IN ('buyer', 'supplier', 'personal'));

-- Create function to automatically create personal tenant for new users
CREATE OR REPLACE FUNCTION public.create_personal_tenant_for_user()
RETURNS TRIGGER AS $$
DECLARE
  personal_tenant_id uuid;
BEGIN
  -- Only create personal tenant if user doesn't already have one
  IF NEW.tenant_id IS NULL THEN
    -- Create a personal tenant for the user
    INSERT INTO public.tenants (name, kind, created_by)
    VALUES (
      COALESCE(NEW.full_name, 'My Personal Workspace'),
      'personal',
      NEW.id
    )
    RETURNING id INTO personal_tenant_id;
    
    -- Update the user's profile to point to their personal tenant
    UPDATE public.profiles 
    SET tenant_id = personal_tenant_id 
    WHERE id = NEW.id;
    
    -- Log the personal tenant creation
    PERFORM public.log_audit_event(
      'personal_tenant_created',
      'tenant',
      personal_tenant_id,
      'Automatic personal tenant creation',
      jsonb_build_object('user_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically create personal tenant after profile is created
DROP TRIGGER IF EXISTS create_personal_tenant_trigger ON public.profiles;
CREATE TRIGGER create_personal_tenant_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_personal_tenant_for_user();