-- Create staging table to capture raw supplier product payloads
CREATE TABLE IF NOT EXISTS public.stg_supplier_products_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_sku TEXT,
    payload JSONB NOT NULL,
    source_info JSONB,
    raw_hash TEXT NOT NULL,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stg_supplier_products_raw_supplier
    ON public.stg_supplier_products_raw (supplier_id, supplier_sku);
