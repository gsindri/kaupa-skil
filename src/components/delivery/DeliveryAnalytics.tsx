
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingDown, TrendingUp, Package, DollarSign, Truck, Calendar } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DeliveryAnalyticsProps {
  data: {
    monthlySpend: Array<{ month: string; fees: number; orders: number }>
    supplierBreakdown: Array<{ supplier: string; fees: number; orders: number; efficiency: number }>
    thresholdAnalysis: {
      totalOrders: number
      ordersWithFees: number
      totalFeesPaid: number
      potentialSavings: number
    }
    trends: {
      feeReduction: number
      orderEfficiency: number
      avgOrderValue: number
    }
  }
}

export function DeliveryAnalytics({ data }: DeliveryAnalyticsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const efficiencyScore = Math.round(
    ((data.thresholdAnalysis.totalOrders - data.thresholdAnalysis.ordersWithFees) / 
     data.thresholdAnalysis.totalOrders) * 100
  )

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Fees</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold">
                {formatPrice(data.thresholdAnalysis.totalFeesPaid)}
              </span>
              {data.trends.feeReduction !== 0 && (
                <Badge variant={data.trends.feeReduction > 0 ? "default" : "destructive"}>
                  {data.trends.feeReduction > 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                  {Math.abs(data.trends.feeReduction)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Orders w/ Fees</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-bold">
                {data.thresholdAnalysis.ordersWithFees}
              </span>
              <span className="text-sm text-muted-foreground">
                of {data.thresholdAnalysis.totalOrders}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Efficiency Score</span>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl font-bold">{efficiencyScore}%</span>
                <Badge variant={efficiencyScore >= 80 ? "default" : efficiencyScore >= 60 ? "secondary" : "destructive"}>
                  {efficiencyScore >= 80 ? "Excellent" : efficiencyScore >= 60 ? "Good" : "Needs work"}
                </Badge>
              </div>
              <Progress value={efficiencyScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Potential Savings</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(data.thresholdAnalysis.potentialSavings)}
              </span>
              <p className="text-xs text-muted-foreground mt-1">
                Per month if optimized
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="suppliers">Supplier Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Fee Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlySpend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'fees' ? formatPrice(value) : value,
                      name === 'fees' ? 'Delivery Fees' : 'Orders'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fees" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="fees"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Delivery Efficiency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.supplierBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="supplier" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'fees' ? formatPrice(value) : `${value}%`,
                      name === 'fees' ? 'Total Fees' : 'Efficiency'
                    ]}
                  />
                  <Bar dataKey="fees" fill="hsl(var(--primary))" name="fees" />
                  <Bar dataKey="efficiency" fill="hsl(var(--secondary))" name="efficiency" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
