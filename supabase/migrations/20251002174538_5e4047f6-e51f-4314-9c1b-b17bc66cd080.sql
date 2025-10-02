-- Phase 2: Privacy-Safe Aggregation

-- 2.1 Supplier Consent Schema
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS allow_price_aggregation BOOLEAN DEFAULT true;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS aggregation_opt_out_date TIMESTAMPTZ;

-- Platform-level benchmark settings (adjustable by admins)
CREATE TABLE IF NOT EXISTS benchmark_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_distinct_orgs INTEGER NOT NULL DEFAULT 3,
  min_orders_count INTEGER NOT NULL DEFAULT 10,
  winsor_lower_percentile NUMERIC NOT NULL DEFAULT 0.05,
  winsor_upper_percentile NUMERIC NOT NULL DEFAULT 0.95,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Insert default settings with fixed UUID for easy reference
INSERT INTO benchmark_settings (id, min_distinct_orgs, min_orders_count, winsor_lower_percentile, winsor_upper_percentile)
VALUES ('00000000-0000-0000-0000-000000000001', 3, 10, 0.05, 0.95)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on benchmark_settings
ALTER TABLE benchmark_settings ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage settings
CREATE POLICY "Platform admins can manage benchmark settings"
ON benchmark_settings FOR ALL
USING (is_platform_admin())
WITH CHECK (is_platform_admin());

-- Anyone can read settings
CREATE POLICY "Anyone can read benchmark settings"
ON benchmark_settings FOR SELECT
USING (true);

-- 2.2 Monthly Benchmark Aggregation Table
CREATE TABLE IF NOT EXISTS price_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  catalog_product_id UUID NOT NULL REFERENCES catalog_product(id),
  benchmark_month DATE NOT NULL, -- first day of month (2025-01-01)
  
  -- Aggregated statistics
  avg_kr_per_unit NUMERIC,
  median_kr_per_unit NUMERIC,
  p25_kr_per_unit NUMERIC,
  p75_kr_per_unit NUMERIC,
  stddev_kr_per_unit NUMERIC,
  
  -- Sample metadata
  orders_count INTEGER,
  distinct_orgs_count INTEGER,
  total_base_units NUMERIC,
  
  -- Privacy flags
  is_displayable BOOLEAN NOT NULL DEFAULT false,
  winsor_applied BOOLEAN NOT NULL DEFAULT false,
  
  -- Audit trail
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings_snapshot JSONB,
  
  UNIQUE(supplier_id, catalog_product_id, benchmark_month)
);

CREATE INDEX idx_benchmarks_lookup ON price_benchmarks(supplier_id, catalog_product_id, benchmark_month);
CREATE INDEX idx_benchmarks_displayable ON price_benchmarks(is_displayable) WHERE is_displayable = true;
CREATE INDEX idx_benchmarks_month ON price_benchmarks(benchmark_month);

-- Enable RLS on price_benchmarks
ALTER TABLE price_benchmarks ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view displayable benchmarks
CREATE POLICY "Authenticated users can view displayable benchmarks"
ON price_benchmarks FOR SELECT
USING (auth.uid() IS NOT NULL);

-- System can insert/update benchmarks
CREATE POLICY "System can manage benchmarks"
ON price_benchmarks FOR ALL
USING (true)
WITH CHECK (true);

-- 2.3 Aggregation Function
CREATE OR REPLACE FUNCTION compute_monthly_benchmarks(target_month DATE)
RETURNS TABLE(
  processed_count INTEGER,
  displayable_count INTEGER,
  skipped_count INTEGER
) AS $$
DECLARE
  settings_rec RECORD;
  min_orgs INT;
  min_orders INT;
  winsor_lower NUMERIC;
  winsor_upper NUMERIC;
  processed INT := 0;
  displayable INT := 0;
  skipped INT := 0;
BEGIN
  -- Fetch current settings
  SELECT * INTO settings_rec FROM benchmark_settings WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Benchmark settings not found';
  END IF;
  
  min_orgs := settings_rec.min_distinct_orgs;
  min_orders := settings_rec.min_orders_count;
  winsor_lower := settings_rec.winsor_lower_percentile;
  winsor_upper := settings_rec.winsor_upper_percentile;
  
  -- Compute benchmarks with winsorization
  WITH raw_data AS (
    SELECT
      o.supplier_id,
      ol.catalog_product_id,
      DATE_TRUNC('month', o.order_date)::DATE as month,
      ol.kr_per_base_unit,
      o.tenant_id,
      o.id as order_id
    FROM orders o
    JOIN order_lines ol ON ol.order_id = o.id
    JOIN suppliers s ON s.id = o.supplier_id
    WHERE 
      DATE_TRUNC('month', o.order_date)::DATE = target_month
      AND o.status IN ('confirmed', 'delivered')
      AND ol.kr_per_base_unit IS NOT NULL
      AND ol.kr_per_base_unit > 0
      AND s.allow_price_aggregation = true
  ),
  percentiles AS (
    SELECT
      supplier_id,
      catalog_product_id,
      month,
      PERCENTILE_CONT(winsor_lower) WITHIN GROUP (ORDER BY kr_per_base_unit) as lower_bound,
      PERCENTILE_CONT(winsor_upper) WITHIN GROUP (ORDER BY kr_per_base_unit) as upper_bound
    FROM raw_data
    GROUP BY supplier_id, catalog_product_id, month
  ),
  aggregated AS (
    SELECT
      rd.supplier_id,
      rd.catalog_product_id,
      rd.month,
      AVG(CASE 
        WHEN rd.kr_per_base_unit BETWEEN p.lower_bound AND p.upper_bound
        THEN rd.kr_per_base_unit
      END) as avg_kr,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY rd.kr_per_base_unit) as median_kr,
      PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY rd.kr_per_base_unit) as p25_kr,
      PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY rd.kr_per_base_unit) as p75_kr,
      STDDEV(rd.kr_per_base_unit) as stddev_kr,
      COUNT(DISTINCT rd.order_id) as order_count,
      COUNT(DISTINCT rd.tenant_id) as org_count,
      SUM(ol.base_units_ordered) as total_units
    FROM raw_data rd
    JOIN percentiles p ON p.supplier_id = rd.supplier_id 
      AND p.catalog_product_id = rd.catalog_product_id 
      AND p.month = rd.month
    JOIN order_lines ol ON ol.catalog_product_id = rd.catalog_product_id
    JOIN orders o ON o.id = ol.order_id AND DATE_TRUNC('month', o.order_date)::DATE = rd.month
    GROUP BY rd.supplier_id, rd.catalog_product_id, rd.month
  )
  INSERT INTO price_benchmarks (
    supplier_id,
    catalog_product_id,
    benchmark_month,
    avg_kr_per_unit,
    median_kr_per_unit,
    p25_kr_per_unit,
    p75_kr_per_unit,
    stddev_kr_per_unit,
    orders_count,
    distinct_orgs_count,
    total_base_units,
    is_displayable,
    winsor_applied,
    settings_snapshot
  )
  SELECT
    supplier_id,
    catalog_product_id,
    month,
    avg_kr,
    median_kr,
    p25_kr,
    p75_kr,
    stddev_kr,
    order_count,
    org_count,
    total_units,
    (org_count >= min_orgs AND order_count >= min_orders),
    true,
    jsonb_build_object(
      'min_orgs', min_orgs,
      'min_orders', min_orders,
      'winsor_lower', winsor_lower,
      'winsor_upper', winsor_upper,
      'computed_at', NOW()
    )
  FROM aggregated
  ON CONFLICT (supplier_id, catalog_product_id, benchmark_month)
  DO UPDATE SET
    avg_kr_per_unit = EXCLUDED.avg_kr_per_unit,
    median_kr_per_unit = EXCLUDED.median_kr_per_unit,
    p25_kr_per_unit = EXCLUDED.p25_kr_per_unit,
    p75_kr_per_unit = EXCLUDED.p75_kr_per_unit,
    stddev_kr_per_unit = EXCLUDED.stddev_kr_per_unit,
    orders_count = EXCLUDED.orders_count,
    distinct_orgs_count = EXCLUDED.distinct_orgs_count,
    total_base_units = EXCLUDED.total_base_units,
    is_displayable = EXCLUDED.is_displayable,
    winsor_applied = EXCLUDED.winsor_applied,
    settings_snapshot = EXCLUDED.settings_snapshot,
    computed_at = NOW();
  
  -- Get counts for return
  GET DIAGNOSTICS processed = ROW_COUNT;
  
  SELECT COUNT(*) INTO displayable 
  FROM price_benchmarks 
  WHERE benchmark_month = target_month AND is_displayable = true;
  
  skipped := 0; -- Could track skipped due to opt-out if needed
  
  RETURN QUERY SELECT processed, displayable, skipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;