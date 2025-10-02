import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, Settings, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BenchmarkManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [targetMonth, setTargetMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  // Fetch benchmark settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['benchmark-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benchmark_settings')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch recent benchmarks
  const { data: recentBenchmarks, isLoading: benchmarksLoading } = useQuery({
    queryKey: ['recent-benchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_benchmarks')
        .select(`
          *,
          catalog_product:catalog_product_id(name, brand),
          supplier:suppliers(name, display_name)
        `)
        .order('computed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const { error } = await supabase
        .from('benchmark_settings')
        .update(newSettings)
        .eq('id', settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['benchmark-settings'] });
      toast({
        title: 'Settings updated',
        description: 'Benchmark settings have been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Run computation mutation
  const runComputationMutation = useMutation({
    mutationFn: async (month: string) => {
      const { data, error } = await supabase.rpc('compute_monthly_benchmarks', {
        target_month: month,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recent-benchmarks'] });
      toast({
        title: 'Computation complete',
        description: `Processed ${data.processed_count} benchmarks. ${data.displayable_count} are displayable.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to compute benchmarks: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleUpdateSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    updateSettingsMutation.mutate({
      min_distinct_orgs: parseInt(formData.get('min_orgs') as string),
      min_orders_count: parseInt(formData.get('min_orders') as string),
      winsor_lower_percentile: parseFloat(formData.get('winsor_lower') as string),
      winsor_upper_percentile: parseFloat(formData.get('winsor_upper') as string),
      updated_at: new Date().toISOString(),
    });
  };

  const handleRunComputation = () => {
    runComputationMutation.mutate(targetMonth);
  };

  if (settingsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Benchmark Management</h1>
            <p className="text-muted-foreground">
              Configure privacy thresholds and compute price benchmarks
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            Benchmarks aggregate order data across organizations to provide market insights
            while respecting supplier consent and privacy thresholds.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Privacy & Aggregation Settings
              </CardTitle>
              <CardDescription>
                Configure minimum thresholds for displaying benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="min_orgs">Minimum Organizations</Label>
                  <Input
                    id="min_orgs"
                    name="min_orgs"
                    type="number"
                    min="2"
                    defaultValue={settings?.min_distinct_orgs}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum number of organizations required
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_orders">Minimum Orders</Label>
                  <Input
                    id="min_orders"
                    name="min_orders"
                    type="number"
                    min="1"
                    defaultValue={settings?.min_orders_count}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum number of orders required
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="winsor_lower">Winsorization Lower (0-1)</Label>
                  <Input
                    id="winsor_lower"
                    name="winsor_lower"
                    type="number"
                    step="0.01"
                    min="0"
                    max="0.5"
                    defaultValue={settings?.winsor_lower_percentile}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower percentile for outlier handling
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="winsor_upper">Winsorization Upper (0-1)</Label>
                  <Input
                    id="winsor_upper"
                    name="winsor_upper"
                    type="number"
                    step="0.01"
                    min="0.5"
                    max="1"
                    defaultValue={settings?.winsor_upper_percentile}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upper percentile for outlier handling
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Settings'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Run Computation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Run Benchmark Computation
              </CardTitle>
              <CardDescription>
                Manually trigger benchmark calculations for a specific month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target_month">Target Month</Label>
                <Input
                  id="target_month"
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  max={new Date().toISOString().slice(0, 7)}
                />
                <p className="text-xs text-muted-foreground">
                  Select the month to compute benchmarks for
                </p>
              </div>

              <Button
                onClick={handleRunComputation}
                className="w-full"
                disabled={runComputationMutation.isPending}
              >
                {runComputationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Computing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Computation
                  </>
                )}
              </Button>

              {runComputationMutation.data && (
                <Alert>
                  <AlertDescription className="space-y-1">
                    <p>
                      <strong>Processed:</strong>{' '}
                      {runComputationMutation.data.processed_count} benchmarks
                    </p>
                    <p>
                      <strong>Displayable:</strong>{' '}
                      {runComputationMutation.data.displayable_count} benchmarks
                    </p>
                    <p>
                      <strong>Skipped:</strong>{' '}
                      {runComputationMutation.data.skipped_count} benchmarks
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Benchmarks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Benchmarks</CardTitle>
            <CardDescription>Latest computed benchmark data</CardDescription>
          </CardHeader>
          <CardContent>
            {benchmarksLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : recentBenchmarks && recentBenchmarks.length > 0 ? (
              <div className="space-y-2">
                {recentBenchmarks.map((benchmark: any) => (
                  <div
                    key={benchmark.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {benchmark.catalog_product?.name || 'Unknown Product'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {benchmark.catalog_product?.brand} • {benchmark.supplier?.display_name || benchmark.supplier_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {new Intl.NumberFormat('is-IS', {
                          style: 'currency',
                          currency: 'ISK',
                          minimumFractionDigits: 0,
                        }).format(benchmark.median_kr_per_unit)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {benchmark.orders_count} orders • {benchmark.distinct_orgs_count} orgs
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No benchmarks computed yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
