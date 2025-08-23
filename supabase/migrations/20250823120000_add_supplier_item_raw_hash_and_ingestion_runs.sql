-- Add raw_hash and availability tracking to supplier_items
ALTER TABLE public.supplier_items
  ADD COLUMN IF NOT EXISTS raw_hash text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','unavailable')),
  ADD COLUMN IF NOT EXISTS missing_cycles integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_supplier_items_status ON public.supplier_items(status);

-- Track ingestion runs and metrics
CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','succeeded','failed')),
  latency_ms integer,
  new_count integer DEFAULT 0,
  changed_count integer DEFAULT 0,
  unavailable_count integer DEFAULT 0,
  error text
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_supplier ON public.ingestion_runs(supplier_id, started_at DESC);
