-- Create supplier_connections table
CREATE TABLE public.supplier_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'needs_login',
    last_sync TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, supplier_id)
);

ALTER TABLE public.supplier_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier connections isolated by tenant" ON public.supplier_connections
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage supplier connections" ON public.supplier_connections
    FOR ALL TO service_role USING (true);

CREATE TRIGGER update_supplier_connections_updated_at
    BEFORE UPDATE ON public.supplier_connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
