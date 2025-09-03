-- Final fix for v_public_catalog view access
-- Add RLS to the v_public_catalog view to prevent anonymous access

-- Since views inherit RLS from their underlying tables, and we already secured those,
-- let's ensure the view properly respects authentication
CREATE POLICY "Authenticated users can view public catalog" 
ON public.v_public_catalog 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Enable RLS on the view
ALTER VIEW public.v_public_catalog ENABLE ROW LEVEL SECURITY;