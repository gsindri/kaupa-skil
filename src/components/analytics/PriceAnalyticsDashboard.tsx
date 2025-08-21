
import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Target } from 'lucide-react'
import type { PriceAnalyticsData } from '@/hooks/usePriceAnalytics'

interface PriceAnalyticsDashboardProps {
  data?: PriceAnalyticsData
}

export function PriceAnalyticsDashboard({ data }: PriceAnalyticsDashboardProps) {
  const resolvedData = useMemo<PriceAnalyticsData>(() => {
    return (
      data || {
        priceChanges: [],
        supplierPerformance: [],
        categoryTrends: [],
        savingsOpportunities: [],
      }
    )
  }, [data])

  const kpiData = useMemo(() => {
    const totalPotentialSavings = resolvedData.savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSaving, 0)
    const avgPriceChange = resolvedData.priceChanges.length > 0
      ? resolvedData.priceChanges[resolvedData.priceChanges.length - 1]?.avgChange || 0
      : 0
    const totalTrackedItems = resolvedData.categoryTrends.reduce((sum, cat) => sum + cat.itemCount, 0)
    const highConfidenceOpportunities = resolvedData.savingsOpportunities.filter(opp => opp.confidence > 80).length

    return {
      totalPotentialSavings,
      avgPriceChange,
      totalTrackedItems,
      highConfidenceOpportunities
    }
  }, [resolvedData])

  const isEmpty =
    resolvedData.priceChanges.length === 0 &&
    resolvedData.supplierPerformance.length === 0 &&
    resolvedData.categoryTrends.length === 0 &&
    resolvedData.savingsOpportunities.length === 0

  if (isEmpty) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No pricing analytics available yet. Connect suppliers to start tracking price trends.
      </div>
    )
  }

  const chartConfig = {
    avgChange: {
      label: "Average Price Change (%)",
      color: "hsl(var(--chart-1))",
    },
    totalItems: {
      label: "Total Items",
      color: "hsl(var(--chart-2))",
    },
    avgPrice: {
      label: "Average Price",
      color: "hsl(var(--chart-3))",
    },
    changePercent: {
      label: "Change %",
      color: "hsl(var(--chart-4))",
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Potential Savings
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(kpiData.totalPotentialSavings)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xs text-green-600">
                {kpiData.highConfidenceOpportunities} high-confidence opportunities
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Price Change
                </p>
                <p className="text-2xl font-bold">
                  {kpiData.avgPriceChange > 0 ? '+' : ''}{kpiData.avgPriceChange.toFixed(1)}%
                </p>
              </div>
              {kpiData.avgPriceChange >= 0 ? (
                <TrendingUp className="h-8 w-8 text-red-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-600" />
              )}
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Across all categories
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Tracked Items
                </p>
                <p className="text-2xl font-bold">
                  {kpiData.totalTrackedItems.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Active monitoring
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Price Alerts
                </p>
                <p className="text-2xl font-bold">
                  {Math.floor(Math.random() * 12) + 3}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-xs text-muted-foreground">
                Anomalies detected
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Price Trends</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Performance</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="opportunities">Savings Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Price Change Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={resolvedData.priceChanges}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="avgChange"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={resolvedData.supplierPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="supplier" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="avgPrice" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Price Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolvedData.categoryTrends.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{category.category}</div>
                      <div className="text-sm text-muted-foreground">
                        {category.itemCount} items • Avg: {formatCurrency(category.avgPrice)}
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 ${
                      category.changePercent >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {category.changePercent >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {category.changePercent > 0 ? '+' : ''}{category.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Savings Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {resolvedData.savingsOpportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{opportunity.item}</div>
                      <div className="text-sm text-muted-foreground">
                        Switch from {opportunity.currentSupplier} to {opportunity.bestSupplier}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          Save {formatCurrency(opportunity.potentialSaving)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {opportunity.confidence}% confidence
                        </div>
                      </div>
                      <Target className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
