import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SupplierOptOut() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers-aggregation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, display_name, allow_price_aggregation, aggregation_opt_out_date')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const toggleOptOutMutation = useMutation({
    mutationFn: async ({ supplierId, newState }: { supplierId: string; newState: boolean }) => {
      const { error } = await supabase
        .from('suppliers')
        .update({
          allow_price_aggregation: newState,
          aggregation_opt_out_date: newState ? null : new Date().toISOString(),
        })
        .eq('id', supplierId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-aggregation'] });
      toast({
        title: 'Updated',
        description: 'Supplier aggregation preference updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (supplierId: string, currentState: boolean) => {
    toggleOptOutMutation.mutate({ supplierId, newState: !currentState });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const optedIn = suppliers?.filter((s) => s.allow_price_aggregation) || [];
  const optedOut = suppliers?.filter((s) => !s.allow_price_aggregation) || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Supplier Consent Management</h1>
            <p className="text-muted-foreground">
              Manage which suppliers participate in price aggregation
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Opted In */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Opted In ({optedIn.length})
              </CardTitle>
              <CardDescription>
                Suppliers allowing price aggregation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {optedIn.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No suppliers opted in
                  </p>
                ) : (
                  optedIn.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {supplier.display_name || supplier.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.id}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(supplier.id, true)}
                        disabled={toggleOptOutMutation.isPending}
                      >
                        <ShieldOff className="h-4 w-4 mr-2" />
                        Opt Out
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opted Out */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-orange-600" />
                Opted Out ({optedOut.length})
              </CardTitle>
              <CardDescription>
                Suppliers excluded from aggregation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {optedOut.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No suppliers opted out
                  </p>
                ) : (
                  optedOut.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {supplier.display_name || supplier.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {supplier.id}
                        </p>
                        {supplier.aggregation_opt_out_date && (
                          <Badge variant="secondary" className="mt-1">
                            Since{' '}
                            {new Date(supplier.aggregation_opt_out_date).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggle(supplier.id, false)}
                        disabled={toggleOptOutMutation.isPending}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Opt In
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
