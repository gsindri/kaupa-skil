-- Phase 1 catalog foundation changes

-- 1. Supplier audit columns
ALTER TABLE public.supplier_product
  ADD COLUMN source_supplier TEXT,
  ADD COLUMN last_ingested_at TIMESTAMPTZ,
  ADD COLUMN confidence_score REAL;

-- 2. Unmatched products staging table
CREATE TABLE public.unmatched_products (
    unmatched_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    supplier_sku TEXT,
    raw_name TEXT,
    payload JSONB,
    attempted_match TEXT,
    inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.unmatched_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.unmatched_products
    FOR SELECT USING (true);

-- 3. Search vector column on catalog_product
ALTER TABLE public.catalog_product ADD COLUMN search_vector tsvector;

CREATE FUNCTION public.catalog_product_search_vector_trigger()
RETURNS trigger AS $$
begin
  new.search_vector :=
    to_tsvector('simple',
      coalesce(new.name,'') || ' ' ||
      coalesce(new.brand,'') || ' ' ||
      coalesce(new.size,'')
    );
  return new;
end
$$ LANGUAGE plpgsql;

CREATE TRIGGER catalog_product_search_vector
  BEFORE INSERT OR UPDATE ON public.catalog_product
  FOR EACH ROW EXECUTE FUNCTION public.catalog_product_search_vector_trigger();

CREATE INDEX idx_catalog_product_search ON public.catalog_product USING GIN (search_vector);

UPDATE public.catalog_product SET search_vector =
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(size,''));

-- 4. Materialized view for catalog with offers
CREATE MATERIALIZED VIEW public.catalog_with_offers AS
SELECT
  cp.catalog_id,
  cp.name,
  cp.brand,
  cp.size,
  cp.image_main,
  o.org_id,
  MIN(o.price) AS cheapest_price
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_id = cp.catalog_id
LEFT JOIN public.offer o ON o.supplier_product_id = sp.supplier_product_id
GROUP BY cp.catalog_id, cp.name, cp.brand, cp.size, cp.image_main, o.org_id;

CREATE UNIQUE INDEX catalog_with_offers_pk ON public.catalog_with_offers (catalog_id, org_id);

CREATE FUNCTION public.refresh_catalog_with_offers()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.catalog_with_offers;
END;
$$ LANGUAGE plpgsql;

-- 5. Public catalog view with supplier coverage
CREATE VIEW public.v_public_catalog AS
SELECT
  cp.catalog_id,
  cp.name,
  cp.brand,
  cp.size,
  cp.image_main,
  cp.category_id,
  cp.search_vector,
  COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]') AS supplier_names
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_id = cp.catalog_id
LEFT JOIN public.suppliers s ON s.id = sp.supplier_id
GROUP BY cp.catalog_id;
