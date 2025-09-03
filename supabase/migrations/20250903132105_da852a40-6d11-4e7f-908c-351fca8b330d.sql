-- Phase 1: Add category_path column to supplier_product table
ALTER TABLE public.supplier_product 
ADD COLUMN category_path text[] DEFAULT NULL;

-- Add index for category filtering performance  
CREATE INDEX IF NOT EXISTS idx_supplier_product_category_path 
ON public.supplier_product USING GIN (category_path);

-- Update v_public_catalog view to include category aggregation
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  MAX(sp.last_seen_at) as availability_updated_at,
  STRING_AGG(DISTINCT sp.pack_size, ', ') as canonical_pack,
  COUNT(DISTINCT sp.supplier_id)::bigint as suppliers_count,
  MAX(sp.image_url) as sample_image_url,
  array_agg(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
  -- Aggregate categories from all suppliers for this product
  array_agg(DISTINCT unnest(sp.category_path)) FILTER (WHERE sp.category_path IS NOT NULL) as category_tags,
  NULL::numeric as best_price,
  MAX(sp.source_url) as sample_source_url,
  -- Priority logic: Check OUT_OF_STOCK first to avoid substring conflicts
  CASE 
    -- Check OUT_OF_STOCK first (most specific patterns)
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%ekki til á lager%' 
                      OR sp.availability_text ILIKE '%out of stock%' 
                      OR sp.availability_text ILIKE '%unavailable%' THEN 1 END) > 0 
         AND COUNT(CASE WHEN sp.availability_text ILIKE '%til á lager%' 
                         AND sp.availability_text NOT ILIKE '%ekki til á lager%' THEN 1 END) = 0
         THEN 'OUT_OF_STOCK'
    -- Check IN_STOCK (but exclude "ekki til á lager")
    WHEN COUNT(CASE WHEN (sp.availability_text ILIKE '%til á lager%' AND sp.availability_text NOT ILIKE '%ekki til á lager%')
                      OR sp.availability_text ILIKE '%in stock%' 
                      OR sp.availability_text ILIKE '%available%' THEN 1 END) > 0 
         THEN 'IN_STOCK'
    -- Check LOW_STOCK
    WHEN COUNT(CASE WHEN sp.availability_text ILIKE '%lítið magn%' 
                      OR sp.availability_text ILIKE '%low stock%' 
                      OR sp.availability_text ILIKE '%limited%' THEN 1 END) > 0 
         THEN 'LOW_STOCK'
    ELSE 'UNKNOWN'
  END as availability_status,
  STRING_AGG(DISTINCT sp.availability_text, ', ') as availability_text
FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
GROUP BY cp.id, cp.name, cp.brand;

-- Update fetch_catalog_facets function to return actual category data
CREATE OR REPLACE FUNCTION public.fetch_catalog_facets(
  _search text DEFAULT NULL,
  _category_ids text[] DEFAULT NULL,
  _supplier_ids text[] DEFAULT NULL,
  _availability text[] DEFAULT NULL,
  _pack_size_ranges text[] DEFAULT NULL,
  _brands text[] DEFAULT NULL
)
RETURNS TABLE(facet text, id text, name text, count bigint)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  -- Categories from supplier category paths
  SELECT 
    'category'::text as facet,
    category::text as id,
    category::text as name,
    COUNT(DISTINCT cp.id)::bigint as count
  FROM public.catalog_product cp
  JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
  CROSS JOIN unnest(sp.category_path) as category
  WHERE sp.category_path IS NOT NULL
    AND (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND (_brands IS NULL OR cp.brand = ANY(_brands))
  GROUP BY category
  
  UNION ALL
  
  -- Suppliers
  SELECT 
    'supplier'::text as facet,
    sp.supplier_id::text as id,
    sp.supplier_id::text as name,
    COUNT(DISTINCT cp.id)::bigint as count
  FROM public.catalog_product cp
  JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
  WHERE (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND (_brands IS NULL OR cp.brand = ANY(_brands))
  GROUP BY sp.supplier_id
  
  UNION ALL
  
  -- Availability statuses
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
  
  -- Brands
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
$$;