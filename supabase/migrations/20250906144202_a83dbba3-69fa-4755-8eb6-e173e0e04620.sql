-- Create suppliers table
CREATE TABLE public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for suppliers
CREATE POLICY "Anyone can view suppliers"
ON public.suppliers FOR SELECT
USING (true);

-- Insert INNNES supplier data
INSERT INTO public.suppliers (id, name, logo_url) VALUES 
('innnes', 'INNNES', '/inneslogo.svg');

-- Update the v_public_catalog view to include supplier logo information
DROP VIEW IF EXISTS public.v_public_catalog;

CREATE VIEW public.v_public_catalog AS
SELECT 
  cp.id as catalog_id,
  cp.name,
  cp.brand,
  cp.size as canonical_pack,
  
  -- Aggregate pack sizes from all suppliers
  array_agg(DISTINCT sp.pack_size) FILTER (WHERE sp.pack_size IS NOT NULL AND sp.active_status = 'ACTIVE') as pack_sizes,
  
  -- Count suppliers
  count(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE') as suppliers_count,
  count(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE') as active_supplier_count,
  
  -- Supplier information
  array_agg(DISTINCT sp.supplier_id) FILTER (WHERE sp.active_status = 'ACTIVE') as supplier_ids,
  array_agg(DISTINCT s.name) FILTER (WHERE sp.active_status = 'ACTIVE') as supplier_names,
  array_agg(DISTINCT s.logo_url) FILTER (WHERE sp.active_status = 'ACTIVE' AND s.logo_url IS NOT NULL) as supplier_logo_urls,
  
  -- Category information from supplier category paths
  array_agg(DISTINCT category_element) FILTER (WHERE category_element IS NOT NULL AND sp.active_status = 'ACTIVE') as category_tags,
  
  -- Sample data from the first active supplier product
  (array_agg(sp.image_url ORDER BY sp.last_seen_at DESC NULLS LAST) FILTER (WHERE sp.image_url IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as sample_image_url,
  (array_agg(sp.source_url ORDER BY sp.last_seen_at DESC NULLS LAST) FILTER (WHERE sp.source_url IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as sample_source_url,
  
  -- Availability information from the most recently updated supplier
  (array_agg(sp.availability_text ORDER BY sp.last_seen_at DESC NULLS LAST) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as availability_text,
  (array_agg(public.derive_availability_status(sp.availability_text) ORDER BY sp.last_seen_at DESC NULLS LAST) FILTER (WHERE sp.availability_text IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as availability_status,
  (array_agg(sp.last_seen_at ORDER BY sp.last_seen_at DESC NULLS LAST) FILTER (WHERE sp.last_seen_at IS NOT NULL AND sp.active_status = 'ACTIVE'))[1] as availability_updated_at,
  
  -- Placeholder for pricing information
  NULL::numeric as best_price,
  false as on_special

FROM public.catalog_product cp
LEFT JOIN public.supplier_product sp ON sp.catalog_product_id = cp.id
LEFT JOIN public.suppliers s ON s.id = sp.supplier_id
LEFT JOIN LATERAL unnest(sp.category_path) as category_element ON true

GROUP BY cp.id, cp.name, cp.brand, cp.size;