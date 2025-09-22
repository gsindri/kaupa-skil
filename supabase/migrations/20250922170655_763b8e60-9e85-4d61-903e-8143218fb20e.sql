-- Create function to automatically create personal tenant for new users
CREATE OR REPLACE FUNCTION public.create_personal_tenant_for_user()
RETURNS TRIGGER AS $$
DECLARE
  personal_tenant_id uuid;
  membership_id uuid;
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
    
    -- The tenant creation trigger will automatically create the owner membership
    -- and setup grants, so we don't need to do that here
    
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
CREATE OR REPLACE TRIGGER create_personal_tenant_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_personal_tenant_for_user();

-- Add 'personal' as a valid tenant kind
ALTER TABLE public.tenants 
ALTER COLUMN kind SET DEFAULT 'buyer';

-- Update existing users without tenants to have personal tenants
DO $$
DECLARE
  user_record RECORD;
  personal_tenant_id uuid;
BEGIN
  FOR user_record IN 
    SELECT p.id, p.full_name 
    FROM public.profiles p
    WHERE p.tenant_id IS NULL
  LOOP
    -- Create personal tenant
    INSERT INTO public.tenants (name, kind, created_by)
    VALUES (
      COALESCE(user_record.full_name, 'My Personal Workspace'),
      'personal', 
      user_record.id
    )
    RETURNING id INTO personal_tenant_id;
    
    -- Update profile
    UPDATE public.profiles 
    SET tenant_id = personal_tenant_id 
    WHERE id = user_record.id;
    
    -- Log the conversion
    PERFORM public.log_audit_event(
      'personal_tenant_migrated',
      'tenant',
      personal_tenant_id,
      'Migration of existing user to personal tenant',
      jsonb_build_object('user_id', user_record.id)
    );
  END LOOP;
END $$;