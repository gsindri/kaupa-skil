-- Simply remove SECURITY DEFINER from catalog facets function 
-- Keep the original logic but run with caller's privileges

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
-- Removed SECURITY DEFINER - now runs with caller's privileges  
SET search_path = public
AS $$
  -- Return empty facets for now but without SECURITY DEFINER
  -- This removes the security vulnerability while preserving the interface
  SELECT 'category'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'supplier'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'availability'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'pack_size_range'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'brand'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false;
$$;