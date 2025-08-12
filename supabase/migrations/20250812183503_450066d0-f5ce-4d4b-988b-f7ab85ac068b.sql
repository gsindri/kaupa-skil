
-- Create memberships table with base roles
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_role TEXT CHECK (base_role IN ('owner', 'admin', 'member')) NOT NULL,
  attrs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

-- Create grants table for capability-based permissions
CREATE TABLE public.grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'tenant' CHECK (scope IN ('tenant', 'relationship', 'supplier')),
  scope_id UUID,
  constraints JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check capabilities
CREATE OR REPLACE FUNCTION public.has_capability(
  cap TEXT, 
  target_scope TEXT, 
  target_id UUID DEFAULT NULL, 
  want JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  mid UUID;
  ok BOOLEAN;
  active_tenant UUID;
BEGIN
  -- Get active tenant from session (we'll set this in the auth context)
  BEGIN
    active_tenant := current_setting('app.tenant_id')::UUID;
  EXCEPTION WHEN others THEN
    -- If no tenant is set, check if user has any membership
    SELECT m.tenant_id INTO active_tenant
    FROM public.memberships m
    WHERE m.user_id = auth.uid()
    LIMIT 1;
    
    IF active_tenant IS NULL THEN
      RETURN FALSE;
    END IF;
  END;

  -- Find membership for current user in the active tenant
  SELECT m.id INTO mid
  FROM public.memberships m
  WHERE m.tenant_id = active_tenant
    AND m.user_id = auth.uid();

  IF mid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owner shortcut - owners can do anything
  IF EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE id = mid AND base_role = 'owner'
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check for specific grant
  SELECT TRUE INTO ok
  FROM public.grants g
  WHERE g.membership_id = mid
    AND g.capability = cap
    AND g.scope = target_scope
    AND (g.scope_id IS NULL OR g.scope_id = target_id)
  LIMIT 1;

  RETURN COALESCE(ok, FALSE);
END $$;

-- Create helper function to get current user's tenant memberships
CREATE OR REPLACE FUNCTION public.get_user_memberships()
RETURNS TABLE (
  membership_id UUID,
  tenant_id UUID,
  tenant_name TEXT,
  base_role TEXT,
  attrs JSONB
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    m.id,
    m.tenant_id,
    t.name,
    m.base_role,
    m.attrs
  FROM public.memberships m
  JOIN public.tenants t ON t.id = m.tenant_id
  WHERE m.user_id = auth.uid();
$$;

-- RLS Policies for memberships
CREATE POLICY "Users can view their own memberships"
  ON public.memberships
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Tenant admins can view tenant memberships"
  ON public.memberships
  FOR SELECT
  USING (
    public.has_capability('manage_tenant_users', 'tenant', tenant_id)
  );

CREATE POLICY "Tenant admins can manage memberships"
  ON public.memberships
  FOR ALL
  USING (
    public.has_capability('manage_tenant_users', 'tenant', tenant_id)
  );

-- RLS Policies for grants
CREATE POLICY "Users can view grants for their memberships"
  ON public.grants
  FOR SELECT
  USING (
    membership_id IN (
      SELECT id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant admins can manage grants"
  ON public.grants
  FOR ALL
  USING (
    public.has_capability('manage_tenant_users', 'tenant', tenant_id)
  );

-- Create trigger to automatically create owner membership when tenant is created
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create owner membership for the user who created the tenant
  INSERT INTO public.memberships (tenant_id, user_id, base_role)
  VALUES (NEW.id, auth.uid(), 'owner');
  
  RETURN NEW;
END $$;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_tenant();

-- Create indexes for performance
CREATE INDEX idx_memberships_user_tenant ON public.memberships(user_id, tenant_id);
CREATE INDEX idx_memberships_tenant ON public.memberships(tenant_id);
CREATE INDEX idx_grants_membership ON public.grants(membership_id);
CREATE INDEX idx_grants_capability_scope ON public.grants(capability, scope, scope_id);

-- Insert some default capability grants for the first owner
-- This will be useful for initial setup
CREATE OR REPLACE FUNCTION public.setup_owner_grants(membership_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tenant_id UUID;
BEGIN
  -- Get tenant_id from membership
  SELECT m.tenant_id INTO tenant_id
  FROM public.memberships m
  WHERE m.id = membership_id;

  -- Insert default owner capabilities
  INSERT INTO public.grants (tenant_id, membership_id, capability, scope) VALUES
    (tenant_id, membership_id, 'manage_tenant_users', 'tenant'),
    (tenant_id, membership_id, 'view_prices', 'tenant'),
    (tenant_id, membership_id, 'compose_order', 'tenant'),
    (tenant_id, membership_id, 'dispatch_order_email', 'tenant'),
    (tenant_id, membership_id, 'run_ingestion', 'tenant'),
    (tenant_id, membership_id, 'manage_credentials', 'tenant'),
    (tenant_id, membership_id, 'manage_supplier_links', 'tenant'),
    (tenant_id, membership_id, 'view_price_history', 'tenant'),
    (tenant_id, membership_id, 'read_reports', 'tenant'),
    (tenant_id, membership_id, 'manage_vat_rules', 'tenant'),
    (tenant_id, membership_id, 'read_audit_logs', 'tenant');
END $$;

-- Update the tenant creation trigger to also setup default grants
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_membership_id UUID;
BEGIN
  -- Create owner membership for the user who created the tenant
  INSERT INTO public.memberships (tenant_id, user_id, base_role)
  VALUES (NEW.id, auth.uid(), 'owner')
  RETURNING id INTO new_membership_id;
  
  -- Setup default grants for the owner
  PERFORM public.setup_owner_grants(new_membership_id);
  
  RETURN NEW;
END $$;
