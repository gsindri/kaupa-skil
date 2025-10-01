-- Remove mock supplier data, keeping only the real Innnes supplier

-- First, delete supplier categories for mock suppliers
DELETE FROM public.supplier_categories 
WHERE supplier_id IN ('sample-supplier-1', 'sample-supplier-2');

-- Then, delete the mock suppliers themselves
DELETE FROM public.suppliers 
WHERE id IN ('sample-supplier-1', 'sample-supplier-2');