-- Insert missing suppliers to fix catalog display
INSERT INTO public.suppliers (id, name, logo_url) 
VALUES ('INNNES', 'Innnes', null)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Drop and recreate the view with proper supplier joins
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT 
  c.id as catalog_id,
  c.name,
  c.brand,
  c.size as canonical_pack,
  ARRAY_AGG(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL) as pack_sizes,
  COUNT(DISTINCT sp.supplier_id) as suppliers_count,
  ARRAY_AGG(DISTINCT sp.supplier_id) FILTER (WHERE sp.supplier_id IS NOT NULL) as supplier_ids,
  ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as supplier_names,
  ARRAY_AGG(DISTINCT s.logo_url) FILTER (WHERE s.logo_url IS NOT NULL) as supplier_logo_urls,
  COUNT(DISTINCT CASE WHEN sp.active_status = 'ACTIVE' THEN sp.supplier_id END) as active_supplier_count,
  MAX(sp.image_url) as sample_image_url,
  MAX(sp.source_url) as sample_source_url,
  MAX(sp.availability_text) as availability_text,
  CASE 
    WHEN MAX(spa.status::text) = 'IN_STOCK' THEN 'IN_STOCK'
    WHEN MAX(spa.status::text) = 'LOW_STOCK' THEN 'LOW_STOCK'
    WHEN MAX(spa.status::text) = 'OUT_OF_STOCK' THEN 'OUT_OF_STOCK'
    ELSE 'UNKNOWN'
  END as availability_status,
  MAX(spa.updated_at) as availability_updated_at,
  false as on_special, -- Placeholder for special offers
  NULL::numeric as best_price, -- Placeholder for pricing
  ARRAY_AGG(DISTINCT sp.category_path) FILTER (WHERE sp.category_path IS NOT NULL) as category_tags
FROM public.catalog_product c
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = c.id
LEFT JOIN public.suppliers s ON s.id = sp.supplier_id
LEFT JOIN public.supplier_product_availability spa ON spa.supplier_product_id = sp.id
WHERE sp.active_status = 'ACTIVE' OR sp.active_status IS NULL
GROUP BY c.id, c.name, c.brand, c.size
ORDER BY c.name;