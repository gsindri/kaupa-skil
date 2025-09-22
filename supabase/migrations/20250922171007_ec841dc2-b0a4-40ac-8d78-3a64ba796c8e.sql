-- Convert existing users without tenants to have personal tenants
DO $$
DECLARE
  user_record RECORD;
  personal_tenant_id uuid;
BEGIN
  FOR user_record IN 
    SELECT p.id, COALESCE(p.full_name, 'My Personal Workspace') as name
    FROM public.profiles p
    WHERE p.tenant_id IS NULL
  LOOP
    -- Create personal tenant
    INSERT INTO public.tenants (name, kind, created_by)
    VALUES (
      user_record.name,
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