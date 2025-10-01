-- Assign categories to suppliers so they show up in searches
-- Get some category IDs first and assign them

-- Assign categories to Innnes (assuming it's a food distributor)
INSERT INTO public.supplier_categories (supplier_id, category_id)
SELECT 'innnes', id FROM public.categories WHERE slug IN ('dairy', 'meat', 'bakery')
ON CONFLICT DO NOTHING;

-- Assign categories to sample suppliers
INSERT INTO public.supplier_categories (supplier_id, category_id)
SELECT 'sample-supplier-1', id FROM public.categories WHERE slug IN ('vegetables', 'dairy', 'bakery')
ON CONFLICT DO NOTHING;

INSERT INTO public.supplier_categories (supplier_id, category_id)
SELECT 'sample-supplier-2', id FROM public.categories WHERE slug IN ('frozen', 'meat', 'beverages')
ON CONFLICT DO NOTHING;