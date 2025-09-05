ALTER TABLE public.suppliers ADD COLUMN logo_url TEXT;

-- Populate existing suppliers with a placeholder logo
UPDATE public.suppliers
SET logo_url = COALESCE(logo_url, 'https://placehold.co/40x40');
