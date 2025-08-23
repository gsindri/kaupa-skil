-- Create catalog products table
CREATE TABLE public.catalog_product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create supplier products table
CREATE TABLE public.supplier_product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_product_id UUID REFERENCES public.catalog_product(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_sku TEXT NOT NULL,
    additional_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (supplier_id, supplier_sku)
);

-- Create offers table
CREATE TABLE public.offer (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_product_id UUID REFERENCES public.supplier_product(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    price NUMERIC(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Updated_at triggers
CREATE TRIGGER update_catalog_product_updated_at
    BEFORE UPDATE ON public.catalog_product
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_product_updated_at
    BEFORE UPDATE ON public.supplier_product
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offer_updated_at
    BEFORE UPDATE ON public.offer
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable row level security
ALTER TABLE public.catalog_product ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.catalog_product
    FOR SELECT USING (true);

ALTER TABLE public.supplier_product ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.supplier_product
    FOR SELECT USING (true);

ALTER TABLE public.offer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offer org isolation" ON public.offer
    FOR ALL USING (auth.uid() = org_id) WITH CHECK (auth.uid() = org_id);
