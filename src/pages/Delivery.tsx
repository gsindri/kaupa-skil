
import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeliveryAnalytics } from '@/components/delivery/DeliveryAnalytics'
import { SmartOrderingSuggestions } from '@/components/delivery/SmartOrderingSuggestions'
import { useDeliveryAnalytics } from '@/hooks/useDeliveryAnalytics'
import { useOrderingSuggestions } from '@/hooks/useOrderingSuggestions'
import { Truck, TrendingDown, AlertTriangle, Settings } from 'lucide-react'

export default function Delivery() {
  const { data: analytics, isLoading: analyticsLoading } = useDeliveryAnalytics()
  const { data: suggestions, isLoading: suggestionsLoading } = useOrderingSuggestions()

  if (analyticsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Truck className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Delivery Cost Optimization</h1>
          <p className="text-muted-foreground">
            Analyze delivery costs and optimize your ordering patterns
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          {analytics ? (
            <DeliveryAnalytics data={analytics} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No delivery analytics data available yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start placing orders to see delivery cost insights.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions">
          {suggestions && suggestions.length > 0 ? (
            <SmartOrderingSuggestions suggestions={suggestions} />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No optimization suggestions available.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add items to your cart to see smart ordering suggestions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Delivery rules and zone settings will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
