-- Fix v_org_catalog function to accept _org parameter properly
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid)
 RETURNS SETOF v_public_catalog
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- For now, just return all public catalog items
  -- This can be enhanced later to filter by organization
  select * from public.v_public_catalog;
$function$;

-- Create fetch_catalog_facets function
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Return empty facets for now - can be enhanced later
  SELECT 'category'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'supplier'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'availability'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'pack_size_range'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false
  UNION ALL
  SELECT 'brand'::text as facet, ''::text as id, ''::text as name, 0::bigint as count WHERE false;
$function$;