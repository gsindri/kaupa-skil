
import React from 'react'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import { PriceAnomalyAlert } from '@/components/dashboard/PriceAnomalyAlert'
import { PriceAnalyticsDashboard } from '@/components/analytics/PriceAnalyticsDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePriceAnalytics } from '@/hooks/usePriceAnalytics'
import { usePriceAnomalies } from '@/hooks/usePriceAnomalies'

export default function Dashboard() {
  const { data: analyticsData, isLoading: analyticsLoading } = usePriceAnalytics()
  const { anomalies = [], isLoading: anomaliesLoading } = usePriceAnomalies()
  const handleViewAnomaly = (id: string) => {
    console.log('View anomaly:', id)
  }

  const handleDismissAnomaly = (id: string) => {
    console.log('Dismiss anomaly:', id)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of your wholesale procurement activity
        </p>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DashboardOverview />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <PriceAnalyticsDashboard data={analyticsData} />
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Price Anomalies</h2>
              <p className="text-muted-foreground mb-4">
                Automatically detected price changes that require attention
              </p>
            </div>
            
            {anomaliesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {anomalies.map((anomaly) => (
                  <PriceAnomalyAlert
                    key={anomaly.id}
                    anomaly={anomaly}
                    onView={handleViewAnomaly}
                    onDismiss={handleDismissAnomaly}
                  />
                ))}

                {anomalies.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No price anomalies detected</p>
                    <p className="text-sm">Your prices are stable across all suppliers</p>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
