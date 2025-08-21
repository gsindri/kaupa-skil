-- Remove previously seeded demo data to ensure production is clean
DELETE FROM public.supplier_items;
DELETE FROM public.delivery_rules;
DELETE FROM public.suppliers;
