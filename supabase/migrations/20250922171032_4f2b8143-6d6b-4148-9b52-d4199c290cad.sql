-- Convert existing users without tenants to have personal tenants with unique names
DO $$
DECLARE
  user_record RECORD;
  personal_tenant_id uuid;
  tenant_name text;
  counter integer;
BEGIN
  FOR user_record IN 
    SELECT p.id, COALESCE(p.full_name, 'My Personal Workspace') as base_name
    FROM public.profiles p
    WHERE p.tenant_id IS NULL
  LOOP
    -- Generate unique tenant name
    tenant_name := user_record.base_name || ' (Personal)';
    counter := 1;
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE name = tenant_name) LOOP
      tenant_name := user_record.base_name || ' (Personal ' || counter || ')';
      counter := counter + 1;
    END LOOP;
    
    -- Create personal tenant
    INSERT INTO public.tenants (name, kind, created_by)
    VALUES (
      tenant_name,
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
      jsonb_build_object('user_id', user_record.id, 'tenant_name', tenant_name)
    );
  END LOOP;
END $$;