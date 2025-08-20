-- Backfill profile tenant_id and verify authorization integrity

-- 1) Set tenant_id for existing profiles based on their memberships
UPDATE public.profiles p
SET tenant_id = m.tenant_id
FROM public.memberships m
WHERE p.id = m.user_id
  AND p.tenant_id IS NULL;

-- 2) Ensure profiles remain aligned with memberships for org users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.profiles p ON p.id = m.user_id
    WHERE p.tenant_id <> m.tenant_id
  ) THEN
    RAISE EXCEPTION 'Detected profiles without matching tenant_id after migration';
  END IF;
END $$;
