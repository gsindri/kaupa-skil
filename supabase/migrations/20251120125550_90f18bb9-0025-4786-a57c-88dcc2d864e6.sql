-- Create alerts table for dashboard notifications
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id text REFERENCES suppliers(id),
  sku text,
  summary text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('high', 'medium', 'info')),
  alert_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_tenant ON alerts(tenant_id);
CREATE INDEX idx_alerts_severity ON alerts(severity) WHERE resolved_at IS NULL;

-- Create delivery_rules table for upcoming deliveries
CREATE TABLE delivery_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id text NOT NULL REFERENCES suppliers(id),
  delivery_days integer[] NOT NULL,
  cutoff_time time,
  flat_fee numeric(10,2),
  free_threshold_ex_vat numeric(10,2),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_rules_tenant ON delivery_rules(tenant_id);
CREATE INDEX idx_delivery_rules_active ON delivery_rules(is_active) WHERE is_active = true;

-- Create supplier_connections table for connection status
CREATE TABLE supplier_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id text NOT NULL REFERENCES suppliers(id),
  status text NOT NULL CHECK (status IN ('not_connected', 'connected', 'needs_login', 'disconnected')),
  last_sync timestamptz,
  next_scheduled_sync timestamptz,
  sync_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, supplier_id)
);

CREATE INDEX idx_supplier_connections_tenant ON supplier_connections(tenant_id);
CREATE INDEX idx_supplier_connections_status ON supplier_connections(status);

-- Enable RLS on all tables
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for alerts
CREATE POLICY "Users can view alerts for their tenant"
  ON alerts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "System can manage alerts"
  ON alerts FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for delivery_rules
CREATE POLICY "Users can view delivery rules for their tenant"
  ON delivery_rules FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage delivery rules for their tenant"
  ON delivery_rules FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- RLS policies for supplier_connections
CREATE POLICY "Users can view connections for their tenant"
  ON supplier_connections FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "System can manage connections"
  ON supplier_connections FOR ALL
  USING (true)
  WITH CHECK (true);