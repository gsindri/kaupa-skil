-- Fix security warnings for live pricing functions

-- Fix get_current_offer search path
CREATE OR REPLACE FUNCTION public.get_current_offer(product_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id
  FROM public.supplier_offer
  WHERE supplier_product_id = product_id
    AND valid_from <= NOW()
    AND (valid_to IS NULL OR valid_to > NOW())
  ORDER BY valid_from DESC
  LIMIT 1;
$$;

-- Fix checkout_validate_prices search path
CREATE OR REPLACE FUNCTION public.checkout_validate_prices(
  order_id_param UUID,
  max_drift_percent NUMERIC DEFAULT 5.0
)
RETURNS TABLE (
  has_drift BOOLEAN,
  drift_items JSONB,
  total_old NUMERIC,
  total_new NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  drift_detected BOOLEAN := false;
  drift_array JSONB := '[]'::JSONB;
  old_total NUMERIC := 0;
  new_total NUMERIC := 0;
  line_record RECORD;
  current_price NUMERIC;
  price_diff_percent NUMERIC;
BEGIN
  -- Lock the order for update
  PERFORM 1 FROM public.orders WHERE id = order_id_param FOR UPDATE;
  
  -- Check each line item
  FOR line_record IN
    SELECT 
      ol.id,
      ol.supplier_product_id,
      ol.quantity_packs,
      ol.unit_price_per_pack as snapshot_price,
      ol.offer_id,
      sp.catalog_product_id,
      cp.name as product_name
    FROM public.order_lines ol
    JOIN public.supplier_product sp ON sp.id = ol.supplier_product_id
    LEFT JOIN public.catalog_product cp ON cp.id = sp.catalog_product_id
    WHERE ol.order_id = order_id_param
  LOOP
    -- Get current offer price
    SELECT so.pack_price INTO current_price
    FROM public.supplier_offer so
    WHERE so.supplier_product_id = line_record.supplier_product_id
      AND so.valid_from <= NOW()
      AND (so.valid_to IS NULL OR so.valid_to > NOW())
    ORDER BY so.valid_from DESC
    LIMIT 1;
    
    -- If no current offer, use snapshot
    IF current_price IS NULL THEN
      current_price := line_record.snapshot_price;
    END IF;
    
    -- Calculate drift
    IF line_record.snapshot_price IS NOT NULL AND line_record.snapshot_price > 0 THEN
      price_diff_percent := ABS(((current_price - line_record.snapshot_price) / line_record.snapshot_price) * 100);
      
      IF price_diff_percent > max_drift_percent THEN
        drift_detected := true;
        drift_array := drift_array || jsonb_build_object(
          'line_id', line_record.id,
          'product_name', line_record.product_name,
          'old_price', line_record.snapshot_price,
          'new_price', current_price,
          'drift_percent', price_diff_percent,
          'quantity', line_record.quantity_packs
        );
      END IF;
    END IF;
    
    -- Accumulate totals
    old_total := old_total + (COALESCE(line_record.snapshot_price, 0) * line_record.quantity_packs);
    new_total := new_total + (current_price * line_record.quantity_packs);
    
    -- Update line with current price (even if no drift)
    UPDATE public.order_lines
    SET 
      unit_price_per_pack = current_price,
      line_total = current_price * quantity_packs,
      offer_id = public.get_current_offer(line_record.supplier_product_id)
    WHERE id = line_record.id;
  END LOOP;
  
  -- Update order validation timestamp
  UPDATE public.orders
  SET prices_last_validated_at = NOW()
  WHERE id = order_id_param;
  
  -- Return results
  RETURN QUERY SELECT drift_detected, drift_array, old_total, new_total;
END;
$$;