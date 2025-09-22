-- Create organization catalog view as a function (fixed syntax)
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid)
RETURNS TABLE(
  catalog_id uuid,
  name text,
  brand text,
  canonical_pack text,
  pack_sizes text[],
  suppliers_count bigint,
  supplier_ids text[],
  supplier_names text[],
  supplier_logo_urls text[],
  active_supplier_count bigint,
  sample_image_url text,
  sample_source_url text,
  availability_status text,
  availability_text text,
  availability_updated_at timestamp with time zone,
  best_price numeric,
  category_tags text[][],
  on_special boolean,
  is_my_supplier boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    cp.id as catalog_id,
    cp.name,
    cp.brand,
    cp.size as canonical_pack,
    ARRAY_AGG(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
    COUNT(DISTINCT sp.supplier_id)::bigint as suppliers_count,
    ARRAY_AGG(DISTINCT sp.supplier_id) as supplier_ids,
    ARRAY_AGG(DISTINCT s.name) as supplier_names,
    ARRAY_AGG(DISTINCT s.logo_url) FILTER (WHERE s.logo_url IS NOT NULL) as supplier_logo_urls,
    COUNT(DISTINCT CASE WHEN sp.active_status = 'ACTIVE' THEN sp.supplier_id END)::bigint as active_supplier_count,
    MAX(sp.image_url) as sample_image_url,
    MAX(sp.source_url) as sample_source_url,
    COALESCE(MAX(derive_availability_status(sp.availability_text)), 'UNKNOWN') as availability_status,
    MAX(sp.availability_text) as availability_text,
    MAX(sp.updated_at) as availability_updated_at,
    NULL::numeric as best_price,
    ARRAY_AGG(sp.category_path) FILTER (WHERE sp.category_path IS NOT NULL) as category_tags,
    false as on_special,
    EXISTS(
      SELECT 1 FROM supplier_credentials sc 
      WHERE sc.supplier_id = ANY(ARRAY_AGG(DISTINCT sp.supplier_id))
      AND sc.tenant_id = _org
    ) as is_my_supplier
  FROM catalog_product cp
  JOIN supplier_product sp ON sp.catalog_product_id = cp.id
  LEFT JOIN suppliers s ON s.id = sp.supplier_id
  WHERE sp.active_status = 'ACTIVE'
  GROUP BY cp.id, cp.name, cp.brand, cp.size;