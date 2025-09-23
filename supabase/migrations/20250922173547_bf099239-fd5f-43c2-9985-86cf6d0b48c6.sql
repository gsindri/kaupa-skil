-- Create simple v_org_catalog function that returns public catalog data
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
    v.catalog_id,
    v.name,
    v.brand,
    v.canonical_pack,
    v.pack_sizes,
    v.suppliers_count,
    v.supplier_ids,
    v.supplier_names,
    v.supplier_logo_urls,
    v.active_supplier_count,
    v.sample_image_url,
    v.sample_source_url,
    v.availability_status,
    v.availability_text,
    v.availability_updated_at,
    v.best_price,
    v.category_tags,
    COALESCE(v.on_special, false) as on_special,
    EXISTS(
      SELECT 1 FROM supplier_credentials sc 
      WHERE sc.tenant_id = _org
      AND sc.supplier_id = ANY(v.supplier_ids)
    ) as is_my_supplier
  FROM v_public_catalog v
  WHERE v.catalog_id IS NOT NULL;
$$;