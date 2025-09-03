-- Phase 1: Add staleness lifecycle columns to supplier_product table
ALTER TABLE public.supplier_product
  ADD COLUMN IF NOT EXISTS active_status text
    CHECK (active_status IN ('ACTIVE','STALE','DELISTED'))
    DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS stale_since timestamptz,
  ADD COLUMN IF NOT EXISTS delisted_reason text;

-- Backfill existing records to ACTIVE status
UPDATE public.supplier_product
   SET active_status = 'ACTIVE'
 WHERE active_status IS NULL;

-- Add indexes for performance (some may already exist)
CREATE INDEX IF NOT EXISTS idx_supplier_product_active_status
  ON public.supplier_product (active_status);

CREATE INDEX IF NOT EXISTS idx_supplier_product_supplier_category
  ON public.supplier_product (supplier_id, active_status, last_seen_at);

-- Phase 2: Update v_public_catalog view to only show ACTIVE items
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id AS catalog_id,
  cp.name,
  cp.brand,
  MAX(sp.last_seen_at) AS availability_updated_at,
  STRING_AGG(DISTINCT sp.pack_size, ', ') AS canonical_pack,
  COUNT(DISTINCT sp.supplier_id)::bigint AS suppliers_count,
  MAX(sp.image_url) AS sample_image_url,
  ARRAY_AGG(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) AS pack_sizes,
  NULL::numeric AS best_price,
  MAX(sp.source_url) AS sample_source_url,
  -- Priority: OUT_OF_STOCK first (avoid 'til á lager' substring issue),
  -- then IN_STOCK, LOW_STOCK, else UNKNOWN.
  CASE 
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%ekki til á lager%'
                      OR sp.availability_text ILIKE '%out of stock%'
                      OR sp.availability_text ILIKE '%unavailable%' THEN 1 END) > 0
         AND COUNT(CASE WHEN sp.availability_text ILIKE '%til á lager%'
                          AND sp.availability_text NOT ILIKE '%ekki til á lager%' THEN 1 END) = 0
      THEN 'OUT_OF_STOCK'
    WHEN COUNT(CASE WHEN (sp.availability_text ILIKE '%til á lager%' AND sp.availability_text NOT ILIKE '%ekki til á lager%')
                      OR sp.availability_text ILIKE '%in stock%'
                      OR sp.availability_text ILIKE '%available%' THEN 1 END) > 0
      THEN 'IN_STOCK'
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%lítið magn%'
                      OR sp.availability_text ILIKE '%low stock%'
                      OR sp.availability_text ILIKE '%limited%' THEN 1 END) > 0
      THEN 'LOW_STOCK'
    ELSE 'UNKNOWN'
  END AS availability_status,
  STRING_AGG(DISTINCT sp.availability_text, ', ') AS availability_text,
  COUNT(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE')::bigint AS active_supplier_count,
  ARRAY_AGG(DISTINCT category) FILTER (WHERE category IS NOT NULL) AS category_tags
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp
  ON sp.catalog_product_id = cp.id
  AND sp.active_status = 'ACTIVE'
LEFT JOIN LATERAL unnest(sp.category_path) AS category ON true
GROUP BY cp.id, cp.name, cp.brand;

-- Phase 3: Update fetch_catalog_facets function to respect active status
CREATE OR REPLACE FUNCTION public.fetch_catalog_facets(_search text DEFAULT NULL::text, _category_ids text[] DEFAULT NULL::text[], _supplier_ids text[] DEFAULT NULL::text[], _availability text[] DEFAULT NULL::text[], _pack_size_ranges text[] DEFAULT NULL::text[], _brands text[] DEFAULT NULL::text[])
RETURNS TABLE(facet text, id text, name text, count bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  -- Categories from supplier category paths (only ACTIVE items)
  SELECT 
    'category'::text as facet,
    category::text as id,
    category::text as name,
    COUNT(DISTINCT cp.id)::bigint as count
  FROM public.catalog_product cp
  JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id,
  unnest(sp.category_path) as category
  WHERE sp.category_path IS NOT NULL
    AND sp.active_status = 'ACTIVE'
    AND (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND (_brands IS NULL OR cp.brand = ANY(_brands))
  GROUP BY category
  
  UNION ALL
  
  -- Suppliers (only ACTIVE items)
  SELECT 
    'supplier'::text as facet,
    sp.supplier_id::text as id,
    sp.supplier_id::text as name,
    COUNT(DISTINCT cp.id)::bigint as count
  FROM public.catalog_product cp
  JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
  WHERE sp.active_status = 'ACTIVE'
    AND (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND (_brands IS NULL OR cp.brand = ANY(_brands))
  GROUP BY sp.supplier_id
  
  UNION ALL
  
  -- Availability statuses (only ACTIVE items)
  SELECT 
    'availability'::text as facet,
    availability_status::text as id,
    availability_status::text as name,
    COUNT(*)::bigint as count
  FROM public.v_public_catalog
  WHERE (_search IS NULL OR name ILIKE '%' || _search || '%')
    AND (_brands IS NULL OR brand = ANY(_brands))
    AND availability_status IS NOT NULL
  GROUP BY availability_status
  
  UNION ALL
  
  -- Brands (only ACTIVE items)
  SELECT 
    'brand'::text as facet,
    brand::text as id,
    brand::text as name,
    COUNT(*)::bigint as count
  FROM public.v_public_catalog
  WHERE (_search IS NULL OR name ILIKE '%' || _search || '%')
    AND brand IS NOT NULL
  GROUP BY brand
  
  ORDER BY facet, count DESC;
$function$;

-- Phase 4: Create automated staleness marking function
CREATE OR REPLACE FUNCTION public.mark_stale_supplier_products(_days int DEFAULT 45)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.supplier_product
     SET active_status   = 'STALE',
         stale_since     = COALESCE(stale_since, now()),
         delisted_reason = COALESCE(delisted_reason, 'not_seen_threshold')
   WHERE (last_seen_at IS NULL OR last_seen_at < now() - make_interval(days => _days))
     AND active_status = 'ACTIVE';
END;
$$;