import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { BenchmarkMonitoring } from '@/components/admin/BenchmarkMonitoring';
import { Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BenchmarkDashboard() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Benchmark Monitoring</h1>
            <p className="text-muted-foreground">
              Real-time monitoring of the price benchmarking system
            </p>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">About This Dashboard</p>
              <p className="text-sm">
                This monitoring dashboard provides real-time insights into the benchmark computation
                system, including computation history, success rates, and system health metrics.
              </p>
              <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                <li>Monitor benchmark computation runs and their success rates</li>
                <li>Track supplier participation in price aggregation</li>
                <li>View displayable benchmark ratios and privacy compliance</li>
                <li>Identify system issues and anomalies</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <BenchmarkMonitoring />
      </div>
    </AppLayout>
  );
}
