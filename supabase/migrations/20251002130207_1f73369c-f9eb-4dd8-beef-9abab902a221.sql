-- Remove unverified placeholder data from suppliers table
-- This includes estimated minimum orders, lead times, and generic badges

-- Clear unverified minimum order amounts
UPDATE public.suppliers 
SET min_order_isk = NULL 
WHERE min_order_isk IS NOT NULL;

-- Clear estimated lead times
UPDATE public.suppliers 
SET avg_lead_time_days = NULL 
WHERE avg_lead_time_days IS NOT NULL;

-- Clear generic AI-generated badges
UPDATE public.suppliers 
SET badges = NULL 
WHERE badges IS NOT NULL;

-- Note: Keeping coverage_areas for now as they may be based on 
-- registered business addresses, but should be verified later