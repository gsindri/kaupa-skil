-- Update staging table structure
ALTER TABLE public.stg_supplier_products_raw
    RENAME COLUMN payload TO raw_payload;
ALTER TABLE public.stg_supplier_products_raw
    DROP COLUMN IF EXISTS supplier_sku,
    DROP COLUMN IF EXISTS source_info,
    DROP COLUMN IF EXISTS inserted_at;
ALTER TABLE public.stg_supplier_products_raw
    ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'api',
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.stg_supplier_products_raw
    ADD CONSTRAINT stg_supplier_products_raw_supplier_raw_hash_key UNIQUE (supplier_id, raw_hash);
DROP INDEX IF EXISTS idx_stg_supplier_products_raw_supplier;
ALTER TABLE public.stg_supplier_products_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role access" ON public.stg_supplier_products_raw
    FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Ingestion jobs table
CREATE TABLE IF NOT EXISTS public.ingest_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    trigger TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error TEXT
);
ALTER TABLE public.ingest_job ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role access" ON public.ingest_job
    FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Ingestion logs table
CREATE TABLE IF NOT EXISTS public.ingest_log (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID REFERENCES public.ingest_job(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.ingest_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role access" ON public.ingest_log
    FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
