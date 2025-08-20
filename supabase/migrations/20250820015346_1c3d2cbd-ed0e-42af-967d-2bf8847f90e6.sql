-- Allow tenantless users and adjust RLS policies

-- Make profiles.tenant_id nullable and update foreign key
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_tenant_id_fkey
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

-- Update profiles view policy to handle null tenant_id
DROP POLICY IF EXISTS "Profiles are viewable by users in same tenant" ON public.profiles;
CREATE POLICY "Profiles are viewable by users in same tenant" ON public.profiles
    FOR SELECT USING (
        (tenant_id IS NULL AND id = auth.uid()) OR
        tenant_id IS NOT DISTINCT FROM (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Allow users to access tenantless supplier credentials
DROP POLICY IF EXISTS "Supplier credentials isolated by tenant" ON public.supplier_credentials;
CREATE POLICY "Supplier credentials isolated by tenant" ON public.supplier_credentials
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id IS NOT DISTINCT FROM (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Allow users to access tenantless orders
DROP POLICY IF EXISTS "Orders isolated by tenant" ON public.orders;
CREATE POLICY "Orders isolated by tenant" ON public.orders
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id IS NOT DISTINCT FROM (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Allow users to access tenantless order lines via orders
DROP POLICY IF EXISTS "Order lines through orders" ON public.order_lines;
CREATE POLICY "Order lines through orders" ON public.order_lines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id
              AND (
                o.tenant_id IS NULL OR o.tenant_id IS NOT DISTINCT FROM (
                    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
                )
              )
        )
    );

-- Allow users to access tenantless connector runs
DROP POLICY IF EXISTS "Connector runs isolated by tenant" ON public.connector_runs;
CREATE POLICY "Connector runs isolated by tenant" ON public.connector_runs
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id IS NOT DISTINCT FROM (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Allow users to access tenantless audit events
DROP POLICY IF EXISTS "Audit events isolated by tenant" ON public.audit_events;
CREATE POLICY "Audit events isolated by tenant" ON public.audit_events
    FOR ALL USING (
        tenant_id IS NULL OR tenant_id IS NOT DISTINCT FROM (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Update later audit_events policy to permit tenantless users
DROP POLICY IF EXISTS "Tenant members can view their tenant audit events" ON public.audit_events;
CREATE POLICY "Tenant members can view their tenant audit events" ON public.audit_events
  FOR SELECT USING (
    tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = audit_events.tenant_id
          AND m.user_id = auth.uid()
    )
  );

-- Update jobs policy to permit tenantless users
DROP POLICY IF EXISTS "Tenant members can view tenant jobs" ON public.jobs;
CREATE POLICY "Tenant members can view tenant jobs" ON public.jobs
  FOR SELECT USING (
    tenant_id IS NULL OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.tenant_id = jobs.tenant_id
          AND m.user_id = auth.uid()
    )
  );

