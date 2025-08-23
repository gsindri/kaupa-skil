-- Tag mock catalog items and add audit table

-- 1. Add provenance and visibility columns to items
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS data_provenance TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- 2. Mark existing rows as mock data
UPDATE public.items
SET data_provenance = 'mock',
    is_public = false;

-- 3. Audit table for tracking mock item merges/deletions
CREATE TABLE IF NOT EXISTS public.mock_item_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mock_item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('merged', 'deleted', 'needs_review')),
  target_item_id UUID REFERENCES public.items(id),
  performed_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.mock_item_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view mock item audit" ON public.mock_item_audit
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.base_role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Platform admins can insert mock item audit" ON public.mock_item_audit
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.base_role IN ('owner', 'admin')
    )
  );
