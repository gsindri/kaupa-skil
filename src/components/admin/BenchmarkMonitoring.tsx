import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function BenchmarkMonitoring() {
  // Fetch recent audit logs for benchmark computations
  const { data: computationHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['benchmark-computation-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .eq('action', 'benchmark_computation_completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch benchmark statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['benchmark-stats'],
    queryFn: async () => {
      const { data: benchmarks, error: benchmarksError } = await supabase
        .from('price_benchmarks')
        .select('*');

      if (benchmarksError) throw benchmarksError;

      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, allow_price_aggregation');

      if (suppliersError) throw suppliersError;

      const totalBenchmarks = benchmarks?.length || 0;
      const displayableBenchmarks = benchmarks?.filter((b) => b.is_displayable).length || 0;
      const optedInSuppliers = suppliers?.filter((s) => s.allow_price_aggregation).length || 0;
      const optedOutSuppliers = suppliers?.filter((s) => !s.allow_price_aggregation).length || 0;

      // Get most recent computation
      const mostRecentBenchmark = benchmarks?.[0];
      const lastComputedAt = mostRecentBenchmark?.computed_at;

      return {
        totalBenchmarks,
        displayableBenchmarks,
        optedInSuppliers,
        optedOutSuppliers,
        lastComputedAt,
        displayablePercentage: totalBenchmarks > 0 
          ? ((displayableBenchmarks / totalBenchmarks) * 100).toFixed(1) 
          : '0',
      };
    },
    refetchInterval: 60000,
  });

  // Check system health
  const getHealthStatus = () => {
    if (!stats) return { status: 'unknown', message: 'Loading...' };

    if (stats.displayableBenchmarks === 0) {
      return { 
        status: 'warning', 
        message: 'No displayable benchmarks yet',
        icon: AlertTriangle,
        color: 'text-orange-600'
      };
    }

    if (parseFloat(stats.displayablePercentage) < 50) {
      return { 
        status: 'warning', 
        message: 'Low displayable benchmark ratio',
        icon: AlertTriangle,
        color: 'text-orange-600'
      };
    }

    return { 
      status: 'healthy', 
      message: 'System operating normally',
      icon: CheckCircle,
      color: 'text-green-600'
    };
  };

  const health = getHealthStatus();
  const HealthIcon = health.icon || Activity;

  if (statsLoading || historyLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status */}
      <Alert>
        <HealthIcon className={`h-4 w-4 ${health.color}`} />
        <AlertDescription>
          <span className="font-semibold">System Health: </span>
          {health.message}
        </AlertDescription>
      </Alert>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBenchmarks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.displayableBenchmarks || 0} displayable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Displayable Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.displayablePercentage || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Meeting privacy thresholds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opted In Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.optedInSuppliers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Participating in aggregation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opted Out Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.optedOutSuppliers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Excluded from aggregation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Computation History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Computation History
          </CardTitle>
          <CardDescription>Recent benchmark computation runs</CardDescription>
        </CardHeader>
        <CardContent>
          {computationHistory && computationHistory.length > 0 ? (
            <div className="space-y-3">
              {computationHistory.map((event) => {
                const metadata = event.meta_data as any;
                const results = metadata?.results || [];
                const successCount = results.filter((r: any) => r.success).length;
                const totalCount = results.length;
                const isSuccess = successCount === totalCount;

                return (
                  <div
                    key={event.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      {isSuccess ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium">
                          Benchmark Computation
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </p>
                        {metadata?.months && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Months: {metadata.months.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={isSuccess ? 'default' : 'secondary'}>
                      {successCount}/{totalCount} successful
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No computation history available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Last Computation Info */}
      {stats?.lastComputedAt && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Last Computation: </span>
            {formatDistanceToNow(new Date(stats.lastComputedAt), { addSuffix: true })}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
