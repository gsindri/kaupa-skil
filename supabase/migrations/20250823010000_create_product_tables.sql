CREATE TABLE public.catalog_product (
    catalog_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gtin TEXT,
    brand TEXT,
    name TEXT NOT NULL,
    size TEXT,
    category_id UUID,
    specs_json JSONB,
    image_main TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.supplier_product (
    supplier_product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    catalog_id UUID REFERENCES public.catalog_product(catalog_id) ON DELETE SET NULL,
    supplier_sku TEXT NOT NULL,
    pack_size TEXT,
    min_order_qty INTEGER,
    status TEXT,
    source_url TEXT,
    data_provenance TEXT,
    provenance_confidence REAL,
    raw_payload_json JSONB,
    raw_hash TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (supplier_id, supplier_sku)
);

CREATE TABLE public.offer (
    offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier_product_id UUID REFERENCES public.supplier_product(supplier_product_id) ON DELETE CASCADE,
    price NUMERIC(12,4),
    currency TEXT,
    availability TEXT,
    discounts_json JSONB,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
