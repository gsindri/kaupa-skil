-- Phase 2 catalog offers and ingestion pipeline

-- 1. Supplier connector configuration
CREATE TABLE public.supplier_connector (
    connector_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('csv','excel','api')),
    schedule TEXT,
    mapping_rules JSONB,
    config JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ingestion job tracking
CREATE TABLE public.ingestion_job (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connector_id UUID NOT NULL REFERENCES public.supplier_connector(connector_id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','succeeded','failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    error TEXT
);

-- 3. Organization-aware catalog view with pricing
CREATE OR REPLACE FUNCTION public.v_org_catalog(
  p_org_id UUID,
  p_search TEXT DEFAULT NULL,
  p_brand TEXT DEFAULT NULL,
  p_supplier TEXT DEFAULT NULL,
  p_category UUID DEFAULT NULL,
  p_has_price BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  catalog_id UUID,
  name TEXT,
  brand TEXT,
  size TEXT,
  image_main TEXT,
  category_id UUID,
  supplier_names JSON,
  cheapest_price NUMERIC
) AS $$
  SELECT
    pc.catalog_id,
    pc.name,
    pc.brand,
    pc.size,
    pc.image_main,
    pc.category_id,
    pc.supplier_names,
    cwo.cheapest_price
  FROM public.v_public_catalog pc
  LEFT JOIN public.catalog_with_offers cwo
    ON cwo.catalog_id = pc.catalog_id AND cwo.org_id = p_org_id
  WHERE
    (p_search IS NULL OR p_search = '' OR pc.search_vector @@ plainto_tsquery('simple', p_search)) AND
    (p_brand IS NULL OR pc.brand = p_brand) AND
    (p_supplier IS NULL OR pc.supplier_names::jsonb ? p_supplier) AND
    (p_category IS NULL OR pc.category_id = p_category) AND
    (p_has_price IS NULL OR (p_has_price = TRUE AND cwo.cheapest_price IS NOT NULL) OR (p_has_price = FALSE AND cwo.cheapest_price IS NULL));
$$ LANGUAGE sql STABLE;
