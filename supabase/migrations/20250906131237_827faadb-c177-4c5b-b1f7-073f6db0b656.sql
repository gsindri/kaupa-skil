-- Create a database function to correct availability status based on Icelandic text
CREATE OR REPLACE FUNCTION public.derive_availability_status(availability_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF availability_text IS NULL THEN
    RETURN 'UNKNOWN';
  END IF;
  
  -- Clean and normalize the text
  availability_text := lower(trim(regexp_replace(availability_text, '<[^>]*>', '', 'g')));
  availability_text := regexp_replace(availability_text, '\s+', ' ', 'g');
  
  -- Check for out of stock patterns
  IF availability_text LIKE '%ekki til%' OR 
     availability_text LIKE '%ekki á lager%' OR 
     availability_text LIKE '%útselt%' THEN
    RETURN 'OUT_OF_STOCK';
  END IF;
  
  -- Check for low stock patterns
  IF availability_text LIKE '%lítið%' OR 
     availability_text LIKE '%fátt%' THEN
    RETURN 'LOW_STOCK';
  END IF;
  
  -- Check for in stock patterns
  IF availability_text LIKE '%til á lager%' OR 
     availability_text LIKE '%á lager%' THEN
    RETURN 'IN_STOCK';
  END IF;
  
  RETURN 'UNKNOWN';
END;
$function$;

-- Update the v_public_catalog view to use the corrected availability status
CREATE OR REPLACE VIEW public.v_public_catalog AS
WITH availability_data AS (
  SELECT 
    sp.catalog_product_id,
    sp.availability_text,
    public.derive_availability_status(sp.availability_text) as derived_status,
    sp.updated_at as availability_updated_at
  FROM public.supplier_product sp
  WHERE sp.active_status = 'ACTIVE'
    AND sp.availability_text IS NOT NULL
  ORDER BY sp.updated_at DESC
),
catalog_with_availability AS (
  SELECT DISTINCT ON (cp.id)
    cp.id as catalog_id,
    cp.name,
    cp.brand,
    cp.size as canonical_pack,
    ad.availability_text,
    ad.derived_status as availability_status,
    ad.availability_updated_at,
    (SELECT count(*) FROM public.supplier_product sp2 WHERE sp2.catalog_product_id = cp.id) as suppliers_count,
    (SELECT count(*) FROM public.supplier_product sp3 WHERE sp3.catalog_product_id = cp.id AND sp3.active_status = 'ACTIVE') as active_supplier_count,
    (SELECT array_agg(DISTINCT sp4.supplier_id) FROM public.supplier_product sp4 WHERE sp4.catalog_product_id = cp.id AND sp4.active_status = 'ACTIVE') as supplier_ids,
    (SELECT array_agg(DISTINCT sp5.supplier_id) FROM public.supplier_product sp5 WHERE sp5.catalog_product_id = cp.id AND sp5.active_status = 'ACTIVE') as supplier_names,
    (SELECT array_agg(DISTINCT category) FROM public.supplier_product sp6, unnest(sp6.category_path) as category WHERE sp6.catalog_product_id = cp.id AND sp6.active_status = 'ACTIVE') as category_tags,
    (SELECT array_agg(DISTINCT sp7.pack_size) FROM public.supplier_product sp7 WHERE sp7.catalog_product_id = cp.id AND sp7.active_status = 'ACTIVE' AND sp7.pack_size IS NOT NULL) as pack_sizes,
    (SELECT sp8.image_url FROM public.supplier_product sp8 WHERE sp8.catalog_product_id = cp.id AND sp8.active_status = 'ACTIVE' AND sp8.image_url IS NOT NULL LIMIT 1) as sample_image_url,
    (SELECT sp9.source_url FROM public.supplier_product sp9 WHERE sp9.catalog_product_id = cp.id AND sp9.active_status = 'ACTIVE' AND sp9.source_url IS NOT NULL LIMIT 1) as sample_source_url,
    NULL::numeric as best_price,
    false as on_special
  FROM public.catalog_product cp
  LEFT JOIN availability_data ad ON ad.catalog_product_id = cp.id
  WHERE EXISTS (
    SELECT 1 FROM public.supplier_product sp
    WHERE sp.catalog_product_id = cp.id 
    AND sp.active_status = 'ACTIVE'
  )
  ORDER BY cp.id, ad.availability_updated_at DESC NULLS LAST
)
SELECT * FROM catalog_with_availability;