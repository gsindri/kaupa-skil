-- Add identifiers and matching metadata
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS gtin TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS mpn TEXT;
ALTER TABLE public.supplier_items ADD COLUMN IF NOT EXISTS gtin TEXT;
ALTER TABLE public.supplier_items ADD COLUMN IF NOT EXISTS mpn TEXT;

ALTER TABLE public.item_matches ADD COLUMN IF NOT EXISTS match_method TEXT;
ALTER TABLE public.item_matches ADD COLUMN IF NOT EXISTS match_score DECIMAL(4,2);
ALTER TABLE public.item_matches ADD COLUMN IF NOT EXISTS review_required BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.match_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_item_id UUID REFERENCES public.supplier_items(id) ON DELETE CASCADE,
  suggested_item_id UUID REFERENCES public.items(id),
  match_method TEXT,
  match_score DECIMAL(4,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.item_redirects (
  from_item_id UUID PRIMARY KEY REFERENCES public.items(id) ON DELETE CASCADE,
  to_item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);
