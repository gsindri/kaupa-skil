
import React from 'react'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import { PriceAnomalyAlert } from '@/components/dashboard/PriceAnomalyAlert'
import { PriceAnalyticsDashboard } from '@/components/analytics/PriceAnalyticsDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Mock analytics data
const mockAnalyticsData = {
  priceChanges: [
    { date: '2024-01-01', avgChange: 2.3, totalItems: 150 },
    { date: '2024-01-02', avgChange: 1.8, totalItems: 152 },
    { date: '2024-01-03', avgChange: -0.5, totalItems: 148 },
    { date: '2024-01-04', avgChange: 3.2, totalItems: 155 },
    { date: '2024-01-05', avgChange: 1.1, totalItems: 157 },
    { date: '2024-01-06', avgChange: -1.2, totalItems: 154 },
    { date: '2024-01-07', avgChange: 2.7, totalItems: 159 }
  ],
  supplierPerformance: [
    { supplier: 'Véfkaupmenn', avgPrice: 3250, priceStability: 85, stockLevel: 92 },
    { supplier: 'Heilsuhúsið', avgPrice: 3800, priceStability: 78, stockLevel: 88 },
    { supplier: 'Nordic Fresh', avgPrice: 2950, priceStability: 92, stockLevel: 95 },
    { supplier: 'Matfuglinn', avgPrice: 3100, priceStability: 81, stockLevel: 90 }
  ],
  categoryTrends: [
    { category: 'Food & Beverages', avgPrice: 2850, changePercent: 2.3, itemCount: 45 },
    { category: 'Dairy Products', avgPrice: 1200, changePercent: -1.2, itemCount: 28 },
    { category: 'Fresh Produce', avgPrice: 650, changePercent: 4.1, itemCount: 32 },
    { category: 'Meat & Seafood', avgPrice: 4200, changePercent: 1.8, itemCount: 22 },
    { category: 'Bakery Items', avgPrice: 890, changePercent: -0.5, itemCount: 18 }
  ],
  savingsOpportunities: [
    {
      item: 'Extra Virgin Olive Oil',
      currentSupplier: 'Heilsuhúsið',
      bestSupplier: 'Véfkaupmenn',
      potentialSaving: 612,
      confidence: 85
    },
    {
      item: 'Organic Carrots',
      currentSupplier: 'Nordic Fresh',
      bestSupplier: 'Matfuglinn',
      potentialSaving: 45,
      confidence: 92
    },
    {
      item: 'Whole Milk 3.9%',
      currentSupplier: 'Véfkaupmenn',
      bestSupplier: 'Heilsuhúsið',
      potentialSaving: 128,
      confidence: 78
    }
  ]
}

const mockAnomalies = [
  {
    id: '1',
    itemName: 'Premium Butter',
    supplier: 'Nordic Fresh',
    type: 'spike' as const,
    severity: 'high' as const,
    currentPrice: 1250,
    previousPrice: 950,
    changePercent: 31.6,
    detectedAt: '2024-01-15T10:30:00Z',
    description: 'Significant price increase detected - 31.6% above historical average'
  },
  {
    id: '2',
    itemName: 'Icelandic Lamb',
    supplier: 'Matfuglinn',
    type: 'volatile' as const,
    severity: 'medium' as const,
    currentPrice: 8900,
    previousPrice: 8200,
    changePercent: 8.5,
    detectedAt: '2024-01-15T09:15:00Z',
    description: 'Price volatility detected - multiple fluctuations in past 24 hours'
  }
]

export default function Dashboard() {
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
          <PriceAnalyticsDashboard data={mockAnalyticsData} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Price Anomalies</h2>
              <p className="text-muted-foreground mb-4">
                Automatically detected price changes that require attention
              </p>
            </div>
            
            {mockAnomalies.map((anomaly) => (
              <PriceAnomalyAlert
                key={anomaly.id}
                anomaly={anomaly}
                onView={handleViewAnomaly}
                onDismiss={handleDismissAnomaly}
              />
            ))}

            {mockAnomalies.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No price anomalies detected</p>
                <p className="text-sm">Your prices are stable across all suppliers</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
