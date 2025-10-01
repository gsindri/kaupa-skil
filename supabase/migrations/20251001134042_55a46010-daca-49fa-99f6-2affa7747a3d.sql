-- Make search_suppliers function SECURITY DEFINER so it can access suppliers table
-- regardless of RLS policies during the search
DROP FUNCTION IF EXISTS public.search_suppliers(text, uuid[], numeric, boolean, integer, integer);

CREATE OR REPLACE FUNCTION public.search_suppliers(
  search_query text DEFAULT NULL,
  category_ids uuid[] DEFAULT NULL,
  min_rating numeric DEFAULT NULL,
  featured_only boolean DEFAULT false,
  limit_count integer DEFAULT 24,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id text,
  name text,
  display_name text,
  legal_name text,
  kennitala text,
  logo_url text,
  short_description text,
  website text,
  contact_email text,
  contact_phone text,
  coverage_areas text[],
  badges text[],
  avg_lead_time_days integer,
  min_order_isk numeric,
  verification_status text,
  is_featured boolean,
  categories jsonb,
  similarity_score real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH supplier_cats AS (
    SELECT 
      sc.supplier_id,
      jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'name_is', c.name_is,
          'slug', c.slug
        )
      ) as categories
    FROM public.supplier_categories sc
    JOIN public.categories c ON c.id = sc.category_id
    GROUP BY sc.supplier_id
  )
  SELECT 
    s.id,
    s.name,
    s.display_name,
    s.legal_name,
    s.kennitala,
    s.logo_url,
    s.short_description,
    s.website,
    s.contact_email,
    s.contact_phone,
    s.coverage_areas,
    s.badges,
    s.avg_lead_time_days,
    s.min_order_isk,
    s.verification_status,
    s.is_featured,
    COALESCE(sc.categories, '[]'::jsonb) as categories,
    CASE 
      WHEN search_query IS NULL THEN 1.0
      ELSE GREATEST(
        similarity(COALESCE(s.display_name, ''), search_query),
        similarity(COALESCE(s.legal_name, ''), search_query),
        similarity(COALESCE(s.short_description, ''), search_query)
      )
    END::real as similarity_score
  FROM public.suppliers s
  LEFT JOIN supplier_cats sc ON sc.supplier_id = s.id
  WHERE 
    s.verification_status = 'approved'
    AND (NOT featured_only OR s.is_featured = true)
    AND (
      search_query IS NULL 
      OR s.display_name ILIKE '%' || search_query || '%'
      OR s.legal_name ILIKE '%' || search_query || '%'
      OR s.short_description ILIKE '%' || search_query || '%'
    )
    AND (
      category_ids IS NULL 
      OR EXISTS (
        SELECT 1 FROM public.supplier_categories sc2
        WHERE sc2.supplier_id = s.id 
        AND sc2.category_id = ANY(category_ids)
      )
    )
  ORDER BY 
    s.is_featured DESC,
    similarity_score DESC,
    s.display_name ASC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;