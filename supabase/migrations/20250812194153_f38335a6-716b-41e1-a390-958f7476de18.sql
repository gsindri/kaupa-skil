
-- Add triggers to handle tenant creation and membership setup
CREATE OR REPLACE FUNCTION public.before_insert_tenant_set_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_tenant_after()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
$$;

-- Create triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'before_insert_tenant_set_creator' AND tgrelid = 'public.tenants'::regclass) THEN
    CREATE TRIGGER before_insert_tenant_set_creator
      BEFORE INSERT ON public.tenants
      FOR EACH ROW EXECUTE FUNCTION public.before_insert_tenant_set_creator();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_new_tenant_after' AND tgrelid = 'public.tenants'::regclass) THEN
    CREATE TRIGGER handle_new_tenant_after
      AFTER INSERT ON public.tenants
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_after();
  END IF;
END
$$;
