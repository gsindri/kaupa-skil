
-- Enable RLS and create extensions
ALTER DATABASE postgres SET "app.tenant_id" = '';

-- Create enums
CREATE TYPE public.user_role AS ENUM ('admin', 'buyer', 'manager');
CREATE TYPE public.connector_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.order_status AS ENUM ('draft', 'submitted', 'confirmed', 'cancelled');
CREATE TYPE public.dispatch_status AS ENUM ('pending', 'sent', 'failed', 'delivered');

-- Core tenancy tables
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'buyer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers and credentials
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_email TEXT,
    ordering_email TEXT,
    website TEXT,
    connector_type TEXT, -- 'portal', 'email', 'api'
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.supplier_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    encrypted_blob TEXT NOT NULL, -- libsodium sealed box
    last_tested_at TIMESTAMP WITH TIME ZONE,
    test_status TEXT, -- 'success', 'failed', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, supplier_id)
);

-- Units and categories
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'kg', 'g', 'L', 'ml', 'each'
    name TEXT NOT NULL,
    base_unit TEXT, -- for conversions
    conversion_factor DECIMAL(10,6), -- to base unit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id),
    vat_code TEXT DEFAULT 'standard',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VAT rules
CREATE TABLE public.vat_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL, -- 'standard', 'reduced', 'zero'
    rate DECIMAL(5,4) NOT NULL, -- 0.24, 0.11, 0.00
    category_id UUID REFERENCES public.categories(id),
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items and supplier items
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    category_id UUID REFERENCES public.categories(id),
    default_unit_id UUID REFERENCES public.units(id),
    ean TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.supplier_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    ext_sku TEXT NOT NULL, -- supplier's SKU
    ean TEXT,
    display_name TEXT NOT NULL,
    pack_qty DECIMAL(10,3) NOT NULL DEFAULT 1,
    pack_unit_id UUID REFERENCES public.units(id),
    yield_pct DECIMAL(5,2) DEFAULT 100.00, -- for waste calculation
    category_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_id, ext_sku)
);

-- Item matching for entity resolution
CREATE TABLE public.item_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_item_id UUID REFERENCES public.supplier_items(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
    confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_item_id, item_id)
);

-- Price quotes and history
CREATE TABLE public.price_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_item_id UUID REFERENCES public.supplier_items(id) ON DELETE CASCADE,
    observed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pack_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'ISK',
    vat_code TEXT DEFAULT 'standard',
    unit_price_ex_vat DECIMAL(10,4), -- computed
    unit_price_inc_vat DECIMAL(10,4), -- computed
    source TEXT, -- 'portal', 'email', 'manual'
    connector_run_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders and order lines
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    status order_status DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    supplier_item_id UUID REFERENCES public.supplier_items(id),
    qty_packs DECIMAL(10,3) NOT NULL,
    pack_price DECIMAL(10,2) NOT NULL,
    unit_price_ex_vat DECIMAL(10,4),
    unit_price_inc_vat DECIMAL(10,4),
    vat_rate DECIMAL(5,4),
    line_total DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order dispatch tracking
CREATE TABLE public.order_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    status dispatch_status DEFAULT 'pending',
    message_id TEXT, -- email message ID
    attachments JSONB DEFAULT '[]', -- array of file paths
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connector runs for ingestion tracking
CREATE TABLE public.connector_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id),
    connector_type TEXT NOT NULL,
    status connector_status DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    items_found INTEGER DEFAULT 0,
    prices_updated INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    log_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit events
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    meta_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connector_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY "Profiles are viewable by users in same tenant" ON public.profiles
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Supplier credentials isolated by tenant" ON public.supplier_credentials
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Orders isolated by tenant" ON public.orders
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Order lines through orders" ON public.order_lines
    FOR ALL USING (
        order_id IN (
            SELECT id FROM public.orders WHERE tenant_id IN (
                SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Connector runs isolated by tenant" ON public.connector_runs
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Audit events isolated by tenant" ON public.audit_events
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Public read access for reference data
CREATE POLICY "Units are publicly readable" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "VAT rules are publicly readable" ON public.vat_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Suppliers are publicly readable" ON public.suppliers FOR SELECT TO authenticated USING (true);

-- Service role policies for system operations
CREATE POLICY "Service role can manage all data" ON public.profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage supplier credentials" ON public.supplier_credentials FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage connector runs" ON public.connector_runs FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage price quotes" ON public.price_quotes FOR ALL TO service_role USING (true);

-- Insert seed data
INSERT INTO public.units (code, name, base_unit, conversion_factor) VALUES
    ('kg', 'Kilogram', 'kg', 1.0),
    ('g', 'Gram', 'kg', 0.001),
    ('L', 'Liter', 'L', 1.0),
    ('ml', 'Milliliter', 'L', 0.001),
    ('each', 'Each', 'each', 1.0),
    ('pack', 'Pack', 'each', 1.0),
    ('case', 'Case', 'each', 1.0);

INSERT INTO public.vat_rules (code, rate) VALUES
    ('standard', 0.24),
    ('reduced', 0.11),
    ('zero', 0.00);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_credentials_updated_at BEFORE UPDATE ON public.supplier_credentials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_supplier_items_updated_at BEFORE UPDATE ON public.supplier_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_dispatches_updated_at BEFORE UPDATE ON public.order_dispatches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
