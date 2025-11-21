-- Function to force delete a cart item (order_line)
-- This bypasses RLS but manually checks tenant ownership to ensure security
CREATE OR REPLACE FUNCTION public.delete_cart_item_force(
  p_order_line_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_order_tenant_id UUID;
BEGIN
  -- Get the current user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User does not have a tenant_id';
  END IF;

  -- Get the order's tenant_id for the given line
  SELECT o.tenant_id INTO v_order_tenant_id
  FROM public.order_lines ol
  JOIN public.orders o ON o.id = ol.order_id
  WHERE ol.id = p_order_line_id;

  -- If line doesn't exist, return false (or true, effectively "gone")
  IF v_order_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verify ownership
  IF v_tenant_id != v_order_tenant_id THEN
    RAISE EXCEPTION 'Access denied: You do not own this order line';
  END IF;

  -- Perform deletion
  DELETE FROM public.order_lines
  WHERE id = p_order_line_id;

  RETURN TRUE;
END;
$$;
