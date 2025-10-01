-- Phase 1: Enhanced Discovery Schema

-- 1. Extend suppliers table with discovery fields
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS legal_name TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS kennitala TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS coverage_areas TEXT[],
ADD COLUMN IF NOT EXISTS badges TEXT[],
ADD COLUMN IF NOT EXISTS avg_lead_time_days INTEGER,
ADD COLUMN IF NOT EXISTS min_order_isk NUMERIC,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Update display_name to use existing name as fallback
UPDATE public.suppliers SET display_name = name WHERE display_name IS NULL;
UPDATE public.suppliers SET legal_name = name WHERE legal_name IS NULL;

-- 2. Create categories taxonomy table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_is TEXT, -- Icelandic translation
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

-- 3. Create supplier_categories junction table
CREATE TABLE IF NOT EXISTS public.supplier_categories (
  supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (supplier_id, category_id)
);

-- Enable RLS on supplier_categories
ALTER TABLE public.supplier_categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view supplier categories
CREATE POLICY "Anyone can view supplier categories"
ON public.supplier_categories FOR SELECT
USING (true);

-- 4. Add full-text search indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_display_name_trgm 
ON public.suppliers USING gin (display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_suppliers_legal_name_trgm 
ON public.suppliers USING gin (legal_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_suppliers_short_description_trgm 
ON public.suppliers USING gin (short_description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_suppliers_verification_status 
ON public.suppliers(verification_status);

CREATE INDEX IF NOT EXISTS idx_suppliers_is_featured 
ON public.suppliers(is_featured) WHERE is_featured = true;

-- 5. Seed Icelandic food categories
INSERT INTO public.categories (name, name_is, slug) VALUES
  ('Produce', 'Grænmeti og ávextir', 'produce'),
  ('Meat & Fish', 'Kjöt og fiskur', 'meat-fish'),
  ('Dairy', 'Mjólkurvörur', 'dairy'),
  ('Bakery', 'Bakarí', 'bakery'),
  ('Beverages', 'Drykkir', 'beverages'),
  ('Dry Goods', 'Þurrkvörur', 'dry-goods'),
  ('Frozen', 'Frosnar vörur', 'frozen'),
  ('Cleaning', 'Hreinlætisvörur', 'cleaning'),
  ('Packaging', 'Umbúðir', 'packaging')
ON CONFLICT (slug) DO NOTHING;

-- 6. Create function for fuzzy supplier search
CREATE OR REPLACE FUNCTION public.search_suppliers(
  search_query TEXT DEFAULT NULL,
  category_ids UUID[] DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  featured_only BOOLEAN DEFAULT false,
  limit_count INTEGER DEFAULT 24,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  display_name TEXT,
  legal_name TEXT,
  kennitala TEXT,
  logo_url TEXT,
  short_description TEXT,
  website TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  coverage_areas TEXT[],
  badges TEXT[],
  avg_lead_time_days INTEGER,
  min_order_isk NUMERIC,
  verification_status TEXT,
  is_featured BOOLEAN,
  categories JSONB,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
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
    END as similarity_score
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