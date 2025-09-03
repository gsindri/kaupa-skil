-- Fix the Security Definer View issue by removing SECURITY DEFINER from catalog facets function
-- and ensuring it works with proper RLS policies instead

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
-- Removed SECURITY DEFINER - function now runs with caller's privileges
SET search_path = public
AS $$
  -- Enhanced facets query that uses authenticated user's permissions
  -- Returns actual facet data based on the catalog that user has access to
  
  -- Brand facets
  SELECT 'brand'::text as facet, 
         COALESCE(cp.brand, 'Unknown')::text as id, 
         COALESCE(cp.brand, 'Unknown')::text as name, 
         COUNT(*)::bigint as count
  FROM public.catalog_product cp
  WHERE (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND (_brands IS NULL OR cp.brand = ANY(_brands))
    AND cp.brand IS NOT NULL
  GROUP BY cp.brand
  
  UNION ALL
  
  -- Supplier facets  
  SELECT 'supplier'::text as facet,
         sp.supplier_id::text as id,
         sp.supplier_id::text as name,
         COUNT(DISTINCT cp.id)::bigint as count
  FROM public.catalog_product cp
  JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
  WHERE (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND (_supplier_ids IS NULL OR sp.supplier_id = ANY(_supplier_ids))
  GROUP BY sp.supplier_id
  
  UNION ALL
  
  -- Availability facets
  SELECT 'availability'::text as facet,
         CASE 
           WHEN sp.availability_text ILIKE '%in stock%' OR sp.availability_text ILIKE '%available%' THEN 'IN_STOCK'
           WHEN sp.availability_text ILIKE '%low stock%' OR sp.availability_text ILIKE '%limited%' THEN 'LOW_STOCK'
           WHEN sp.availability_text ILIKE '%out of stock%' OR sp.availability_text ILIKE '%unavailable%' THEN 'OUT_OF_STOCK'
           ELSE 'UNKNOWN'
         END::text as id,
         CASE 
           WHEN sp.availability_text ILIKE '%in stock%' OR sp.availability_text ILIKE '%available%' THEN 'In Stock'
           WHEN sp.availability_text ILIKE '%low stock%' OR sp.availability_text ILIKE '%limited%' THEN 'Low Stock'
           WHEN sp.availability_text ILIKE '%out of stock%' OR sp.availability_text ILIKE '%unavailable%' THEN 'Out of Stock'
           ELSE 'Unknown'
         END::text as name,
         COUNT(DISTINCT cp.id)::bigint as count
  FROM public.catalog_product cp
  JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
  WHERE (_search IS NULL OR cp.name ILIKE '%' || _search || '%')
    AND sp.availability_text IS NOT NULL
  GROUP BY 
    CASE 
      WHEN sp.availability_text ILIKE '%in stock%' OR sp.availability_text ILIKE '%available%' THEN 'IN_STOCK'
      WHEN sp.availability_text ILIKE '%low stock%' OR sp.availability_text ILIKE '%limited%' THEN 'LOW_STOCK'
      WHEN sp.availability_text ILIKE '%out of stock%' OR sp.availability_text ILIKE '%unavailable%' THEN 'OUT_OF_STOCK'
      ELSE 'UNKNOWN'
    END;
$$;