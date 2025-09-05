-- Reinstate RLS and grants on v_public_catalog view after modification
GRANT SELECT ON public.v_public_catalog TO authenticated, anon;

ALTER VIEW public.v_public_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view public catalog" ON public.v_public_catalog;
CREATE POLICY "Authenticated users can view public catalog"
  ON public.v_public_catalog
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

