-- Make Innnes a featured supplier for testing
UPDATE public.suppliers 
SET is_featured = true 
WHERE id = 'innnes';

-- Verify all suppliers have proper display_name
UPDATE public.suppliers 
SET display_name = COALESCE(display_name, name)
WHERE display_name IS NULL;

-- Add a few more featured suppliers for better showcase (optional sample data)
-- These can be real or placeholder suppliers
INSERT INTO public.suppliers (
  id,
  name,
  display_name,
  legal_name,
  kennitala,
  short_description,
  website,
  contact_email,
  contact_phone,
  coverage_areas,
  badges,
  avg_lead_time_days,
  min_order_isk,
  verification_status,
  is_featured,
  logo_url
) VALUES 
(
  'sample-supplier-1',
  'Reykjavik Food Co.',
  'Reykjavík Food Co.',
  'Reykjavik Food Company ehf.',
  '5401234567',
  'Premium local food distributor serving Reykjavik and surrounding areas',
  'https://example.com',
  'info@rvkfood.is',
  '+354 555 1234',
  ARRAY['Reykjavik', 'Capital Region'],
  ARRAY['Local', 'Organic'],
  2,
  50000,
  'approved',
  true,
  null
),
(
  'sample-supplier-2',
  'Nordic Wholesale',
  'Nordic Wholesale',
  'Nordic Wholesale hf.',
  '5409876543',
  'Nationwide distributor of fresh and frozen products',
  'https://example.com',
  'sales@nordicwholesale.is',
  '+354 555 5678',
  ARRAY['Nationwide', 'All Iceland'],
  ARRAY['Fast Delivery', 'Bulk Orders'],
  3,
  75000,
  'approved',
  true,
  null
)
ON CONFLICT (id) DO UPDATE SET
  is_featured = EXCLUDED.is_featured,
  display_name = EXCLUDED.display_name;