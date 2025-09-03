-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.v_org_catalog(_org uuid DEFAULT NULL)
RETURNS SETOF v_public_catalog
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- For now, just return all public catalog items
  -- This can be enhanced later to filter by organization
  SELECT * FROM public.v_public_catalog;
$function$;