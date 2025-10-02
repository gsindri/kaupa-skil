import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Shield, TrendingUp, Clock, Database, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function BenchmarkDocumentation() {
  return (
    <div className="space-y-6 max-w-4xl">
      <Alert>
        <BookOpen className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold">Price Benchmarking System Documentation</p>
          <p className="text-sm mt-1">
            This system provides privacy-safe price benchmarking by aggregating order data across
            organizations while respecting supplier consent and privacy thresholds.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Orders are tracked with normalized unit prices (kr per base unit)</li>
              <li>
                Nightly job computes monthly benchmarks by aggregating prices across organizations
              </li>
              <li>Winsorization removes outliers (default: 5th-95th percentile)</li>
              <li>Privacy thresholds ensure minimum data points before display</li>
              <li>Benchmarks are displayed in the catalog for price comparison</li>
            </ol>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Data Flow</h3>
            <div className="text-sm space-y-2">
              <p>
                <strong>1. Order Creation:</strong> When orders are created, the system calculates
                kr_per_base_unit for each line item
              </p>
              <p>
                <strong>2. Nightly Aggregation:</strong> pg_cron triggers the compute-benchmarks
                edge function at 2 AM UTC
              </p>
              <p>
                <strong>3. Privacy Filtering:</strong> Only benchmarks meeting minimum thresholds
                are marked displayable
              </p>
              <p>
                <strong>4. API Access:</strong> Frontend fetches benchmarks via
                get-price-benchmark edge function
              </p>
              <p>
                <strong>5. UI Display:</strong> Price comparison badges appear in catalog when
                benchmarks exist
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Privacy Thresholds</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Minimum Organizations:</strong> Default 3 - prevents identification of
                individual organization's pricing
              </li>
              <li>
                <strong>Minimum Orders:</strong> Default 10 - ensures sufficient data for
                statistical validity
              </li>
              <li>
                <strong>Winsorization:</strong> Caps outliers at 5th/95th percentile to reduce
                impact of extreme values
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Supplier Consent</h3>
            <p className="text-sm mb-2">
              Suppliers can opt out of price aggregation at any time. When a supplier opts out:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Their products are excluded from future benchmark calculations</li>
              <li>Existing benchmarks containing their data remain visible</li>
              <li>The opt-out date is recorded for audit purposes</li>
              <li>They can opt back in to resume participation</li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Data Security</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Row-Level Security (RLS) policies protect all benchmark data</li>
              <li>Only aggregated statistics are exposed, never individual order prices</li>
              <li>Audit logs track all benchmark computations and access</li>
              <li>Service role key is required for computation edge functions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Key Tables</h3>
            <div className="space-y-3 text-sm">
              <div className="border rounded-lg p-3">
                <p className="font-semibold">orders</p>
                <p className="text-muted-foreground">
                  Tracks orders with supplier, tenant, order_date, and delivery info
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-semibold">order_lines</p>
                <p className="text-muted-foreground">
                  Individual line items with kr_per_base_unit, base_units_ordered, and product
                  references
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-semibold">price_benchmarks</p>
                <p className="text-muted-foreground">
                  Aggregated monthly benchmarks with median, p25, p75, avg, and privacy metadata
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-semibold">benchmark_settings</p>
                <p className="text-muted-foreground">
                  Configurable thresholds for privacy protection (min_orgs, min_orders,
                  winsorization)
                </p>
              </div>

              <div className="border rounded-lg p-3">
                <p className="font-semibold">suppliers</p>
                <p className="text-muted-foreground">
                  Supplier consent tracking via allow_price_aggregation and aggregation_opt_out_date
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Key Functions</h3>
            <div className="space-y-2 text-sm">
              <div>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  compute_monthly_benchmarks(target_month)
                </code>
                <p className="text-muted-foreground mt-1">
                  Aggregates order data for a specific month with winsorization and privacy checks
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  compute_kr_per_base_unit(...)
                </code>
                <p className="text-muted-foreground mt-1">
                  Normalizes prices to ISK per base unit, handling VAT and currency conversion
                </p>
              </div>
              <div>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  trigger_benchmark_computation()
                </code>
                <p className="text-muted-foreground mt-1">
                  Called by pg_cron to invoke the compute-benchmarks edge function
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automated Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Nightly Refresh Job</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Schedule:</strong> Every day at 2:00 AM UTC (cron: <code>0 2 * * *</code>)
              </li>
              <li>
                <strong>Scope:</strong> Computes benchmarks for current month and previous month
              </li>
              <li>
                <strong>Mechanism:</strong> pg_cron triggers trigger_benchmark_computation()
                function
              </li>
              <li>
                <strong>Execution:</strong> Function invokes compute-benchmarks edge function via
                HTTP
              </li>
              <li>
                <strong>Logging:</strong> Results are logged to audit_events for monitoring
              </li>
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Manual Triggering</h3>
            <p className="text-sm">
              Administrators can manually trigger benchmark computations from the Benchmark
              Management page without waiting for the scheduled job. This is useful for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>Testing the computation process</li>
              <li>Recomputing benchmarks after data corrections</li>
              <li>Backfilling historical months</li>
              <li>Immediate updates after configuration changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">get-price-benchmark</h3>
            <p className="text-sm mb-2">
              Retrieves benchmark data for a specific product-supplier combination.
            </p>
            <div className="bg-muted p-3 rounded-lg text-xs font-mono">
              POST /functions/v1/get-price-benchmark
              <br />
              Body: &#123; supplier_id, catalog_product_id &#125;
            </div>
            <p className="text-sm mt-2 text-muted-foreground">
              Returns: benchmark stats, user's own price, and comparison metrics
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">compute-benchmarks</h3>
            <p className="text-sm mb-2">
              Triggers benchmark computation for specified months (admin only).
            </p>
            <div className="bg-muted p-3 rounded-lg text-xs font-mono">
              POST /functions/v1/compute-benchmarks
              <br />
              Body: &#123; target_month?, last_n_months? &#125;
            </div>
            <p className="text-sm mt-2 text-muted-foreground">
              Returns: computation results with processed/displayable/skipped counts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
