-- Drop NOT NULL constraint on tenant_id for personal data tables
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_tenant_id_fkey,
  ALTER COLUMN tenant_id DROP NOT NULL,
  ADD CONSTRAINT orders_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.delivery_analytics
  DROP CONSTRAINT IF EXISTS delivery_analytics_tenant_id_fkey,
  ALTER COLUMN tenant_id DROP NOT NULL,
  ADD CONSTRAINT delivery_analytics_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.connector_runs
  DROP CONSTRAINT IF EXISTS connector_runs_tenant_id_fkey,
  ALTER COLUMN tenant_id DROP NOT NULL,
  ADD CONSTRAINT connector_runs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.support_sessions
  DROP CONSTRAINT IF EXISTS support_sessions_tenant_id_fkey,
  ALTER COLUMN tenant_id DROP NOT NULL,
  ADD CONSTRAINT support_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;
